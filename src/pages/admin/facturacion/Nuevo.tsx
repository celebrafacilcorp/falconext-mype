import { ChangeEvent, useEffect, useRef, useState } from "react";
import Select from "@/components/Select";
import { IInvoicesState, useInvoiceStore } from "@/zustand/invoices";
import { IExtentionsState, useExtentionsStore } from "@/zustand/extentions";
import { Calendar } from "@/components/Date";
import { IClientsState, useClientsStore } from "@/zustand/clients";
import { IProductsState, useProductsStore } from "@/zustand/products";
import DataTable from "@/components/Datatable";
import { Icon } from "@iconify/react/dist/iconify.js";
import QRCode from 'qrcode';
import { pdf } from "@react-pdf/renderer";
import { IFormInvoice } from "@/interfaces/invoices";
import { numberToWords } from "@/utils/numberToLetters";
import { calculateTotals } from "@/utils/calculateTotals";
import useAlertStore from "@/zustand/alert";
import { IAuthState, useAuthStore } from "@/zustand/auth";
import { IFormClient } from "@/interfaces/clients";
import { IFormProduct } from "@/interfaces/products";
import InputPro from "@/components/InputPro";
import { StyleSheet } from '@react-pdf/renderer';
import { formatISO, parse } from 'date-fns'
import { useIsMobile } from "@/hooks/useIsMobile";
import { useDebounce } from "@/hooks/useDebounce";
import PrintPDF from "./print";
import ModalReponseInvoice from "./modalResponseInvoice";
import ModalProduct from "../inventario/modal-productos";
import ModalClient from "../clientes/ModalCliente";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Button";
import { useReactToPrint } from "react-to-print";
import ComprobantePrintPage from "./comprobanteImprimir";

const Invoice = () => {

    const { receipt, importReference, addInformalInvoice, addProductsInvoice, productsInvoice, getInvoiceBySerieCorrelative, resetProductInvoice, invoiceData, deleteProductInvoice, addInvoice, dataReceipt, resetInvoice, getSerieAndCorrelativeByReceipt }: IInvoicesState = useInvoiceStore();
    const { auth } = useAuthStore();
    const tiposInformales = ['TICKET', 'NV', 'RH', 'CP', 'NP', 'OT'];
    let tipoEmpresa = auth?.empresa?.tipoEmpresa || "";
    const initialDocumentType = receipt === "" ? "FACTURA" : receipt.toUpperCase();
    // Definir tipos de comprobantes

    const tiposFormales = ['01', '03', '07', '08']; // FACTURA, BOLETA, NOTA CRÉDITO, NOTA DÉBITO

    // Métodos de pago disponibles según tipo
    const metodosContado = ['Efectivo', 'Yape', 'Plin']; // Al contado
    const metodosCredito = ['Transferencia', 'Tarjeta']; // A crédito

    const [paymentMethod, setPaymentMethod] = useState<string>('Efectivo')
    const [adelanto, setAdelanto] = useState<number>(0);
    const [fechaRecojo, setFechaRecojo] = useState<string>('');
    const [adelantoError, setAdelantoError] = useState<string>('');

    const esPagoAlContado = metodosContado.includes(paymentMethod);
    const esPagoAlCredito = metodosCredito.includes(paymentMethod);

    const initFormValues: IFormInvoice = {
        clienteId: 0,
        currencyCode: "PEN",
        clienteNombre: "",
        comprobante: initialDocumentType,
        tipoDoc: tipoEmpresa === "INFORMAL" && initialDocumentType === "TICKET" ? "TICKET" : initialDocumentType === "NOTA DE CREDITO" ? "07" : initialDocumentType === "NOTA DE DEBITO" ? "08" : initialDocumentType === "BOLETA" ? "03" : "01",
        detalles: [],
        discount: 0,
        motivo: "",
        relatedInvoiceId: "",
        vuelto: 0,
        tipDocAfectado: "",
        motivoId: 0,
        medioPago: "",
        numDocAfectado: "",
        observaciones: ""
    }

    const productsInit = [{
        productCode: "",
        name: "",
        stock: "",
        quantity: "",
        unitPrice: "",
        descount: "",
        venta: "",
        igv: "",
        total: ""
    }]

    const initialFormClient: IFormClient = {
        id: 0,
        nombre: "",
        nroDoc: "",
        direccion: "",
        departamento: "",
        distrito: "",
        provincia: "",
        persona: "CLIENTE",
        ubigeo: "",
        email: "",
        telefono: "",
        tipoDoc: "",
        estado: "",
        tipoDocumentoId: 0,
        empresaId: 0,
        tipoDocumento: {
            codigo: "",
            descripcion: "",
            id: 0
        }
    }

    const initialFormProduct: IFormProduct = {
        productoId: 0,
        descripcion: "",
        categoriaId: 0,
        precioUnitario: 0,
        categoriaNombre: "",
        afectacionNombre: "Gravado – Operación Onerosa",
        tipoAfectacionIGV: "10",
        stock: 50,
        codigo: "",
        unidadMedidaId: 1,
        unidadMedidaNombre: "UNIDAD",
        estado: ""
    }

    const [formValuesProduct, setFormValuesProduct] = useState<IFormProduct>(initialFormProduct);
    const [formValuesClient, setFormValuesClient] = useState<IFormClient>(initialFormClient);
    const [formValues, setFormValues] = useState<IFormInvoice>(initFormValues);
    const esComprobanteInformal = tiposInformales.includes(formValues.tipoDoc);
    const { getAllClients, clients }: IClientsState = useClientsStore();
    const { getAllProducts, products }: IProductsState = useProductsStore();
    const [selectedProduct, setSelectProduct] = useState<any>(null);
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const { getCreditDebitNoteTypes, getCurrencies, creditDebitNoteTypes, getDocumentTypes }: IExtentionsState = useExtentionsStore();
    const [productsTable, _setProductsTable] = useState(productsInit);
    const [receiptNoteId, setReceiptNoteId] = useState<string>("01")
    const [pay, setPay] = useState<number>(0);
    const [change, setChange] = useState<number>(0);
    const [receiptNote, setReceiptNote] = useState<string>("FACTURA")
    const [serie, setSerie] = useState<string>("");
    const [IsOpenModalSuccessInvoice, setIsOpenModalSuccessInvoice] = useState<boolean>(false);
    const [correlative, setCorrelative] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [descountGlobal, setDescountGlobal] = useState<number>(0)
    const [errors, setErrors] = useState({
        observaciones: ""
    });

    const [errorsProduct, setErrorsProduct] = useState({
        codigo: "",
        descripcion: "",
        categoriaId: 0,
        description: "",
        precioUnitario: "",
        stock: "",
        unidadMedida: ""
    });

    const [errorsClient, setErrorsClient] = useState({
        nombre: "",
        nroDoc: "",
        direccion: "",
        departamento: "",
        distrito: "",
        provincia: "",
        ubigeo: "",
        email: "",
        telefono: "",
        estado: "",
        tipoDocumentoId: 0,
        empresaId: 0,
    });

    const isMobile = useIsMobile();
    const [isOpenModalClient, setIsOpenModalClient] = useState<boolean>(false);
    const [isOpenModalProduct, setIsOpenModalProduct] = useState<boolean>(false);
    const debounceSerie = useDebounce(serie, 200);
    const debounceCorrelative = useDebounce(correlative, 200);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormValues({
            ...formValues,
            [e?.target?.name]: e?.target?.value
        })
    }

    const navigate = useNavigate();
    const [printSize, setPrintSize] = useState("TICKET");

    const handleChangePrint = (_idValue: any, value: any, _name: any, _id: any) => {
        setPrintSize(value)
    }

    const handleChangeSelect = (idValue: any, value: any, name: any, id: any) => {
        const clientSelect = clients?.find((item: any) => value.split("-")[1] === item.nombre);
        if (clientSelect !== undefined) {
            setSelectedClient(clientSelect);
        }
        const motivo: any = typesOperation.find((item: any) => Number(item.id) === Number(idValue));
        const updatedFormValues = {
            ...formValues,
            [name]: value,
            [id]: idValue,
            motivoId: motivo?.id
        };
        setFormValues(updatedFormValues);
    };

    console.log(products)

    const handleChangeSelectProduct = (_idValue: any, value: any, _name: any, _id: any) => {
        console.log(_idValue)
        const productSelect = products?.find((item: any) => Number(_idValue) === item.id);
        console.log(productSelect)
        setSelectProduct(productSelect)
    }

    const handleChangeSelectReceiptNote = (_idValue: any, value: any, _name: any, _id: any) => {
        setReceiptNote(value)
        setReceiptNoteId(_idValue)
    }

    useEffect(() => {
        if (selectedProduct !== null && selectedProduct !== undefined) {
            addProductsInvoice({
                ...selectedProduct,
                unidadMedida: selectedProduct?.unidadMedida?.nombre
            })
        }
    }, [selectedProduct])

    useEffect(() => {
        getCreditDebitNoteTypes();
        getCurrencies();
        getDocumentTypes()
    }, [])

    const handleGetDataClient = (query: string, callback: Function) => {
        if (query.length > 2) {
            getAllClients(
                {
                    search: query
                },
                callback,
                true,
            )
        }
    };

    const handleGetDataProduct = (query: string, callback: Function) => {
        if (query.length > 2) {
            getAllProducts(
                {
                    search: query
                },
                callback,
                true,
            )
        }
    }

    useEffect(() => {
        if (receipt === undefined) {
            resetInvoice();
        }
    }, [])


    const handleDeleteProduct = (row: any) => {
        deleteProductInvoice(row);
    };

    // Actualizar las acciones
    const actions = [
        {
            onClick: handleDeleteProduct,
            className: 'delete',
            icon: <Icon icon='material-symbols:delete-outline' color='#EF443C' />,
            tooltip: 'Eliminar',
        },
    ];

    console.log(productsInvoice)

    const productsObject = productsInvoice?.map((item: any) => ({
        id: item?.id,
        descripcion: item.descripcion,
        stock: item?.stock,
        cantidad: item.cantidad,
        unidadMedida: item?.unidadMedida?.nombre || item?.unidadMedida,
        precioUnitario: item?.precioUnitario,
        cantidadOriginal: item?.cantidadOriginal,
        descuento: item?.descuento,
        sale: item?.sale,
        igv: item?.igv,
        total: item?.total
    }))

    const { total, discount: productDiscount, hasDiscount } = calculateTotals(productsInvoice);
    // Calculamos los valores ajustados aplicando el descuento global (solo si codigo es "06")
    const isDiscountGlobalApplicable = formValues.motivoId === 6;
    const totalOriginal = Number(total); // Total sin descuento global
    const totalAdjusted = isDiscountGlobalApplicable ? Math.max(totalOriginal - descountGlobal, 0) : totalOriginal; // Total con descuento global aplicado
    const igvRate = 0.18; // Tasa de IGV en Perú (18%)
    const opGravadaAdjusted = totalAdjusted / (1 + igvRate); // Recalculamos opGravada basado en el total ajustado
    const igvAdjusted = totalAdjusted - opGravadaAdjusted; // Recalculamos IGV
    const importeReferencial = totalOriginal; // Importe referencial es el total original
    const finalDiscount = isDiscountGlobalApplicable ? Number(productDiscount) + descountGlobal : Number(productDiscount); // Suma de descuentos

    const totalDescount = productsInvoice.length > 0 && formValues.motivoId === 4 && productsInvoice
        ?.map((d: any) => d?.precioUnitario)
        ?.reduce((sum: any, x: any) => sum + x);

    const totalInteres = productsInvoice.length > 0 && (formValues.motivoId === 8 || formValues.motivoId === 10) && productsInvoice
        ?.map((d: any) => d?.precioUnitario)
        ?.reduce((sum: any, x: any) => sum + x);

    const totalInWords = numberToWords(parseFloat(totalAdjusted.toFixed(2))) + " SOLES";

    // Mantener sincronizado el campo 'vuelto' que se envía al backend
    useEffect(() => {
        setFormValues((prev) => ({
            ...prev,
            vuelto: totalAdjusted <= pay ? Number(Math.abs(totalAdjusted - pay).toFixed(2)) : 0,
        }));
    }, [pay, totalAdjusted]);

    const addInvoiceReceipt = async () => {
        if (!validateForm()) {
            return;
        }
        if (formValues?.comprobante === "FACTURA" && selectedClient?.nroDoc.length === 8) {
            return useAlertStore.getState().alert("El número de documento del cliente debe ser un ruc para generar una factura", "error")
        }
        if (serie === "" && formValues?.comprobante === "NOTA DE CREDITO") {
            return useAlertStore.getState().alert("La serie es obligatorio para poder generar un comprobante de credito | debito", "error")
        }
        if (correlative === "" && formValues?.comprobante === "NOTA DE CREDITO") {
            return useAlertStore.getState().alert("El correlativo es obligatorio para poder generar un comprobante de credito | debito", "error")
        }
        if (formValues?.clienteNombre === "") {
            return useAlertStore.getState().alert("El cliente es obligatorio", "error")
        }

        const fechaEmision = formatISO(new Date(), { representation: 'complete' });
        
        // Validaciones para NP
        if (formValues.tipoDoc === "NP" && adelanto > totalAdjusted) {
            return useAlertStore.getState().alert("El adelanto no puede ser mayor al total", "error");
        }
        
        // Parsear fechaRecojo solo si viene en formato correcto
        let fechaRecojoFinal = null;
        if (formValues.tipoDoc === "NP" && fechaRecojo) {
            try {
                const parsed = parse(fechaRecojo, 'dd/MM/yyyy', new Date());
                fechaRecojoFinal = formatISO(parsed, { representation: 'complete' });
            } catch (e) {
                console.error('Error parseando fechaRecojo:', e);
            }
        }

        console.log(productsInvoice)
        
        const baseData = {
            tipoOperacionId: 1,
            fechaEmision,
            medioPago: paymentMethod,
            vuelto: formValues?.vuelto,
            clienteId: Number(formValues?.clienteId) || invoiceData?.cliente?.id,
            clienteName: selectedClient?.nombre,
            tipoDoc: formValues?.tipoDoc,
            detalles: productsInvoice?.map((item: any) => ({
                productoId: Number(item?.productoId !== undefined ? item?.productoId : item?.id),
                descripcion: item.descripcion,
                cantidad: Number(item.cantidad),
                nuevoValorUnitario: Number(item.precioUnitario),
                descuento: Number(item.descuento ?? 0)
            })),
            formaPagoTipo: "Contado",
            formaPagoMoneda: "PEN",
            tipoMoneda: "PEN",
            descuento: finalDiscount,
            leyenda: totalInWords,
            observaciones: formValues?.observaciones || formValues?.motivo,
            adelanto: formValues.tipoDoc === "NP" && adelanto > 0 ? adelanto : undefined,
            fechaRecojo: formValues.tipoDoc === "NP" && fechaRecojoFinal ? fechaRecojoFinal : undefined,
        };

        // Construimos los datos finales, añadiendo codigo y relatedInvoiceId solo si es NOTA_CREDITO o NOTA_DEBITO
        const finalData: any =
            formValues.comprobante === "NOTA DE CREDITO" || formValues.comprobante === "NOTA DE DEBITO"
                ? {
                    ...baseData,
                    motivoId: formValues.motivoId,
                    tipDocAfectado: receiptNoteId,
                    numDocAfectado: `${serie.toUpperCase()}-${correlative}`,
                    montoDescuentoGlobal: Number(totalDescount),
                    montoInteresMora: Number(totalInteres)
                }
                : baseData;

        setIsOpenModalSuccessInvoice(true);
        setIsLoading(true);
        const result = tiposInformales.includes(formValues.tipoDoc)
            ? await addInformalInvoice(finalData)
            : await addInvoice(finalData);


        if (result.success === true) {
            setIsLoading(false)
        } else {
            setIsOpenModalSuccessInvoice(false);
            setIsLoading(false);
            console.log("Error al crear el invoice:", result.error);
        }
    };

    console.log(productsInvoice)

    const receiptsToNote = [{ id: "01", value: "FACTURA" }, { id: "03", value: "BOLETA" }];
    let replaceToFilter = formValues?.comprobante?.replace("NOTA DE ", "");
    const typesOperation = creditDebitNoteTypes?.filter((item: any) => item?.tipo === replaceToFilter);


    useEffect(() => {
        if (formValues?.comprobante === "NOTA DE CREDITO") {
            getSerieAndCorrelativeByReceipt(auth?.empresa?.id, formValues?.tipoDoc, receiptNoteId);
        } else if (formValues?.comprobante === "NOTA DE DEBITO") {
            getSerieAndCorrelativeByReceipt(auth?.empresa?.id, formValues?.tipoDoc, receiptNoteId);
        } else if (formValues?.comprobante === "FACTURA") {
            resetInvoice();
            setSerie("");
            setCorrelative("");
            setFormValues({
                ...formValues,
                clienteNombre: ""
            })
            getSerieAndCorrelativeByReceipt(auth?.empresa?.id, formValues?.tipoDoc);
        } else if (formValues?.comprobante === "BOLETA") {
            resetInvoice();
            setSerie("");
            setCorrelative("");
            getSerieAndCorrelativeByReceipt(auth?.empresa?.id, formValues?.tipoDoc);
        } else {
            resetInvoice();
            setSerie("");
            setCorrelative("");
            getSerieAndCorrelativeByReceipt(auth?.empresa?.id, formValues?.tipoDoc);
        }
    }, [formValues.comprobante, receiptNoteId]);

    const tiposComprobanteFormales =
        [{ id: "01", value: "FACTURA" },
        { id: "03", value: "BOLETA" },
        { id: "07", value: "NOTA DE CREDITO" },
        { id: "08", value: "NOTA DE DEBITO" },
        { id: "TICKET", value: "TICKET" },
        { id: "OT", value: "ORDEN DE TRABAJO" },
        { id: "NV", value: "NOTA DE VENTA" },
        { id: "NP", value: "NOTA DE PEDIDO" },
        { id: "CP", value: "COMPROBANTE DE PAGO" },
        { id: "RH", value: "RECIBO POR HONORARIO" }
        ]

    const tiposComprobantesInformales =
        [{ id: "TICKET", value: "TICKET" },
        { id: "OT", value: "ORDEN DE TRABAJO" },
        { id: "NV", value: "NOTA DE VENTA" },
        { id: "NP", value: "NOTA DE PEDIDO" },
        { id: "CP", value: "COMPROBANTE DE PAGO" },
        { id: "RH", value: "RECIBO POR HONORARIO" },]

    let comprobantesGenerar = tipoEmpresa === "INFORMAL" ? tiposComprobantesInformales : tipoEmpresa === "FORMAL" ? tiposComprobanteFormales : tiposComprobanteFormales.concat(tiposComprobantesInformales)

    console.log(comprobantesGenerar)

    const monedas = [{ id: "PEN", value: "SOLES" }, { id: "DOL", value: "DOLARES" }]
    const impresion = [{ id: "A4", value: "A4" }, { id: "A5", value: "A5" }, { id: "TICKET", value: "TICKET" }]

    console.log(formValues)

    const validateForm = () => {
        const newErrors: any = {
            observaciones:
                formValues.motivoId === 2
                    ? (formValues.observaciones.trim() !== ""
                        ? ""
                        : "Escriba la observación dependiendo del tipo de operación")
                    : "",
        };
        setErrors(newErrors);
        return Object.values(newErrors).every((error) => !error); // Retorna `true` si no hay errores
    };


    useEffect(() => {
        if (invoiceData !== null) {
            setSelectedClient({
                nombre: invoiceData?.cliente?.nombre,
                direccion: invoiceData?.cliente?.direccion,
                nroDoc: invoiceData?.cliente?.nroDoc
            })
            setFormValues({
                ...formValues,
                clienteNombre: `${invoiceData?.cliente?.nroDoc}-${invoiceData?.cliente?.nombre}`
            })
        }
    }, [invoiceData])


    const getDocumentInvoice = async () => {
        const result = await getInvoiceBySerieCorrelative(debounceSerie.toUpperCase(), debounceCorrelative, formValues.motivoId);
        console.log(result)
        if (result.error) {
            useAlertStore.getState().alert(`${result.error}`, 'error');
            return
        }
        if (!result.success) {
            return
        }
    }

    useEffect(() => {
        if (formValues?.comprobante === "BOLETA") {
            const clientSelect: any = clients?.find((item: any) => "10000000" === item.nroDoc);
            console.log(clientSelect)
            if (clientSelect === undefined) {
                setSelectedClient({
                    nroDoc: "10000000",
                    nombre: "CLIENTES VARIOS"
                })
            } else {
                setSelectedClient(clientSelect)
            }

            setFormValues({
                ...formValues,
                clienteNombre: "CLIENTES VARIOS",
                motivoId: 0,
                motivo: ""
            })
        } else if (formValues?.comprobante === "FACTURA") {
            setFormValues({
                ...formValues,
                clienteNombre: "",
                motivoId: 0,
                motivo: ""
            })
        }
        else if (formValues?.comprobante === "NOTA DE CREDITO") {
            console.log("bello")
            setFormValues({
                ...formValues,
                clienteNombre: "",
                motivoId: 1
            })
        }
        else if (formValues?.comprobante === "NOTA DE DEBITO") {
            setFormValues({
                ...formValues,
                clienteNombre: "",
                motivoId: 8
            })
        }
    }, [formValues?.comprobante])

    const closeModal = () => {
        setIsOpenModalClient(false);
        setIsOpenModalProduct(false)
    }

    console.log(formValues)

    useEffect(() => {
        if (formValues.motivoId === 1) {
            setFormValues({
                ...formValues,
                motivo: "ANULACION DE LA OPERACION"
            })
        }
        if (formValues.motivoId === 8) {
            setFormValues({
                ...formValues,
                motivo: "INTERESES POR MORA"
            })
        }
    }, [formValues?.motivoId])

    useEffect(() => {
        if (formValues.motivoId) {
            resetProductInvoice();
        }
    }, [formValues.motivoId])

    // Create Document Component

    const ruc = "204812192919";
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

    useEffect(() => {
        const generateQR = async () => {
            try {
                const dataUrl = await QRCode.toDataURL(ruc, {
                    width: 90,
                    margin: 1,
                    color: {
                        dark: '#000000', // Color oscuro del QR
                        light: '#ffffff', // Color claro (fondo)
                    },
                    errorCorrectionLevel: 'H', // Alta corrección de errores
                });
                setQrCodeDataUrl(dataUrl);
            } catch (err) {
                console.error("Error al generar el QR:", err);
            }
        };
        generateQR();
    }, []);


    const componentRef = useRef(null);

    const [dimensions, setDimensions] = useState(() => {
        switch (printSize) {
            case 'TICKET': return { width: 80, height: 297 }; // 80mm width for ticket
            case 'A5': return { width: 148, height: 210 }; // A5 standard size
            case 'A4': return { width: 210, height: 297 }; // A4 standard size
            default: return { width: 210, height: 297 };
        }
    });

    useEffect(() => {
        setDimensions(() => {
            switch (printSize) {
                case 'TICKET': return { width: 80, height: 297 };
                case 'A5': return { width: 148, height: 210 };
                case 'A4': return { width: 210, height: 297 };
                default: return { width: 210, height: 297 };
            }
        });
        console.log('Dimensions updated:', dimensions, 'for printSize:', printSize);
    }, [printSize]);

    const printFn = useReactToPrint({
        // @ts-ignore
        contentRef: componentRef,
        pageStyle: `@media print {
    @page {
      size: ${dimensions.width}mm ${dimensions.height}mm;
      margin: 0;
    }
    body {
      width: ${dimensions.width}mm;
      height: ${dimensions.height}mm;
      overflow: hidden;
    }
    .p-5 {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
    }
  }`,
    });

    const handleOpenNewTab = (vista: string) => {
        printFn();
    };

    const closeModalResponse = () => {
        setIsOpenModalSuccessInvoice(false);
        // Reiniciar valores del formulario y pagos
        setFormValues({
            ...initFormValues,
            comprobante: formValues?.comprobante,
            tipoDoc: formValues.tipoDoc,
            vuelto: 0,
        });
        setPay(0);
        setChange(0);
        setPaymentMethod('Efectivo');
        resetInvoice();
        resetProductInvoice();
        // Si es BOLETA, establecer por defecto CLIENTES VARIOS inmediatamente
        if (formValues?.comprobante === "BOLETA") {
            const clientSelect: any = clients?.find((item: any) => "10000000" === item.nroDoc);
            if (clientSelect === undefined) {
                setSelectedClient({
                    nroDoc: "10000000",
                    nombre: "CLIENTES VARIOS",
                });
                setFormValues((prev) => ({
                    ...prev,
                    clienteNombre: "CLIENTES VARIOS",
                }));
            } else {
                setSelectedClient(clientSelect);
                setFormValues((prev) => ({
                    ...prev,
                    clienteNombre: clientSelect?.nombre || "CLIENTES VARIOS",
                }));
            }
        } else {
            setSelectedClient(null); // Limpiar el cliente seleccionado
        }
        setSelectProduct(null);  // Limpiar el producto seleccionado
        setSerie("");           // Limpiar la serie
        setCorrelative("");
        setTimeout(() => {
            console.log(formValues.tipoDoc, receiptNoteId)
            if (formValues?.comprobante === "NOTA DE CREDITO") {
                getSerieAndCorrelativeByReceipt(auth?.empresa?.id, formValues?.tipoDoc, receiptNoteId);
            } else if (formValues?.comprobante === "NOTA DE DEBITO") {
                getSerieAndCorrelativeByReceipt(auth?.empresa?.id, formValues?.tipoDoc, receiptNoteId);
            } else if (formValues?.comprobante === "FACTURA") {
                resetInvoice();
                setSerie("");
                setCorrelative("");
                setFormValues({
                    ...formValues,
                    clienteNombre: ""
                })
                getSerieAndCorrelativeByReceipt(auth?.empresa?.id, formValues?.tipoDoc);
            } else if (formValues?.comprobante === "BOLETA") {
                resetInvoice();
                setSerie("");
                setCorrelative("");
                getSerieAndCorrelativeByReceipt(auth?.empresa?.id, formValues?.tipoDoc);
            } else {
                resetInvoice();
                setSerie("");
                setCorrelative("");
                getSerieAndCorrelativeByReceipt(auth?.empresa?.id, formValues?.tipoDoc);
            }
        }, 1000);   // Limpiar el correlativo
    };

    console.log(formValues)

    const handleChangeDate = (date: string, name: string) => {
        console.log(name, date)
        setFechaRecojo(date);
    }

    console.log(auth)

    return (
        <div className="px-0 py-0 md:px-8 md:py-4">
            <ComprobantePrintPage
                id="print-root"
                company={auth}
                qrCodeDataUrl={qrCodeDataUrl}
                productsInvoice={productsInvoice}
                total={total}
                mode={"vista previa"}
                componentRef={componentRef}
                size={printSize}
                formValues={{
                    ...formValues,
                    serie: dataReceipt?.serie,
                    correlativo: dataReceipt?.correlativo,
                    numDocAfectado: `${serie}-${correlative}`,
                    medioPago: formValues?.comprobante === "NOTA DE PEDIDO" ? "" : paymentMethod
                }}
                serie={serie}
                correlative={correlative}
                discount={finalDiscount.toString()}
                receipt={formValues?.comprobante}
                selectedClient={selectedClient}
                totalInWords={totalInWords}
                observation={formValues?.observaciones || formValues?.motivo}
            />
            <div className="rounded-xl bg-[#fff] p-5 grid grid-cols-12 md:gap-5 gap-y-5">
                <div className="md:col-start-1 md:col-end-4 col-span-12">
                    <Select defaultValue={formValues?.comprobante} error={""} isSearch options={comprobantesGenerar} id="tipoDoc" name="comprobante" value="" onChange={handleChangeSelect} icon="clarity:box-plot-line" isIcon label="Comprobante" />
                </div>
                <div className="md:col-start-4 md:col-end-5 col-span-12">
                    <Select disabled defaultValue={"SOLES"} error={""} isSearch options={monedas} id="currencyId" name="currencyCode" value="" onChange={handleChangeSelect} icon="clarity:box-plot-line" isIcon label="Moneda" />
                </div>
                <div className="md:col-start-5 md:col-end-7 col-span-12">
                    <Select defaultValue={"TICKET"} error={""} isSearch options={impresion} id="printId" name="print" value="" onChange={handleChangePrint} icon="clarity:box-plot-line" isIcon label="Impresion" />
                </div>
                <div className="md:col-start-7 md:col-end-10 col-span-12">
                    <Calendar disabled text="Fecha" autocomplete="off" name="contact" onChange={handleChange} isLabel label="Contacto" />
                </div>
                <div className="md:col-start-10 md:col-end-13 col-span-12">
                    <div className="border-2 border-[#4870ff] border-dashed p-3 rounded-lg text-center">
                        <label className="font-bold" htmlFor="">{formValues?.comprobante}</label>
                        <p>{dataReceipt?.serie} - {dataReceipt?.correlativo}</p>
                    </div>
                </div>
                {
                    (formValues?.comprobante === "NOTA DE CREDITO" || formValues?.comprobante === "NOTA DE DEBITO") && (
                        <>
                            <div className="md:col-start-1 md:col-end-4 col-span-12">
                                <Select defaultValue={"FACTURA"} error={""} isSearch options={receiptsToNote} id="receiptNoteId" name="receiptNote" value="" onChange={handleChangeSelectReceiptNote} icon="clarity:box-plot-line" isIcon label="Modificar recibo emitido" />
                            </div>
                            <div className="md:col-start-4 md:col-end-7 col-span-12 grid grid-cols-12 gap-7 w-full">
                                <div className="col-start-1 col-end-4 col-span-2">
                                    <InputPro maxLength={4} name="serie" value={serie} isLabel label="Serie" onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setSerie(e.target.value)} />
                                </div>
                                <div className="md:col-start-4 md:col-end-7 col-span-3">
                                    <InputPro maxLength={1000000000} name="" value={correlative} isLabel label="Correlativo" onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCorrelative(e.target.value)} />
                                </div>
                                <div className="md:col-start-7 md:col-end-13 col-span-6">
                                    <div className="relative top-6">
                                        <Button onClick={getDocumentInvoice} color="primary">Buscar documento</Button>
                                    </div>
                                </div>
                            </div>
                            <div className="md:col-start-7 md:col-end-11 col-span-12">
                                <Select defaultValue={formValues.motivoId === 8 ? "INTERESES POR MORA" : formValues.motivoId === 1 ? "ANULACION DE OPERACIÓN" : formValues.motivo} error={""} isSearch options={typesOperation?.map((item: any) => ({
                                    id: item.id,
                                    value: item.descripcion.toUpperCase()
                                }))} id="motivoId" name="motivo" value="" onChange={handleChangeSelect} icon="clarity:box-plot-line" isIcon label="Tipo de Operacion" />
                            </div>
                        </>
                    )
                }

                <div className="md:col-start-1 md:col-end-7 col-span-12">
                    <div className="grid gap-[61px] grid-cols-12 items-center">
                        <div className="md:col-start-1 md:col-end-10 col-span-12">
                            <Select disabled={formValues?.motivoId !== undefined && formValues.motivoId !== 0} handleGetData={handleGetDataClient} value={formValues?.clienteNombre} error={""} isSearch options={clients?.map((item: any) => ({
                                id: item?.id,
                                value: `${item?.nroDoc}-${item.nombre}`
                            }))} id="clienteId" name="clienteNombre" onChange={handleChangeSelect} icon="clarity:box-plot-line" isIcon label="Busca y elije al cliente" />
                        </div>
                        <div className="md:col-start-10 md:col-end-13 col-span-12">
                            <div className="relative top-3">
                                <Button color="primary" disabled={formValues.comprobante === "NOTA DE CREDITO"} onClick={() => setIsOpenModalClient(true)}>Nuevo Cliente</Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:col-start-7 md:col-end-13 col-span-12">
                    <div className="grid grid-cols-12 gap-10 items-center">
                        <div className="md:col-start-1 md:col-end-10 col-span-12">
                            <Select disabled={formValues?.motivoId !== undefined && formValues.motivoId !== 0} handleGetData={handleGetDataProduct} value={selectedProduct ? `${selectedProduct.descripcion}- S/ ${selectedProduct.precioUnitario}` : ""} error={""} isSearch options={products?.map((item: any) => ({
                                id: item?.id,
                                value: `${item.descripcion}- S/ ${item.precioUnitario}`
                            }))} id="productId" name="product" onChange={handleChangeSelectProduct} icon="clarity:box-plot-line" isIcon label="Busca y elije los productos que deseas agregar" />
                        </div>
                        <div className="md:col-start-10 md:col-end-13 col-span-12">
                            <div className="relative top-3">
                                <Button color="primary" disabled={formValues.comprobante === "NOTA DE CREDITO"} onClick={() => setIsOpenModalProduct(true)}>Nuevo producto</Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:col-start-1 md:col-end-13 col-span-12">
                    <div className="overflow-hidden overflow-x-scroll md:overflow-x-visible">
                        <DataTable formValues={formValues} actions={actions} bodyData={productsInvoice?.length > 0 ? productsObject : productsTable}
                            headerColumns={[
                                'Producto',
                                'Stock',
                                'Cantidad',
                                'Uni. Med.',
                                'P.U',
                                'Descuento %',
                                'Venta',
                                'IGV',
                                'Importe'
                            ]} />
                    </div>
                </div>

                <div className="md:col-start-1 md:col-end-6 col-span-12">

                    <InputPro value={formValues.motivo} error={errors.observaciones} type="textarea" autocomplete="off" name="observaciones" onChange={handleChange} isLabel label="Observacion" />
                    <div className="grid grid-cols-2 gap-10 mb-5">
                        {
                            formValues?.comprobante === "NOTA DE PEDIDO" && (

                                <>
                                    <InputPro
                                        type="number"
                                        name="adelanto"
                                        value={adelanto}
                                        error={adelantoError}
                                        isLabel
                                        label="Adelanto"
                                        onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setAdelanto(Number(e.target.value))}
                                    />

                                    <Calendar
                                        text="Fecha de Recojo"
                                        autocomplete="off"
                                        name="fechaRecojo"
                                        onChange={(value: string) => setFechaRecojo(value)}
                                        isLabel
                                        label="Fecha de Recojo"
                                    />
                                </>

                            )
                        }
                    </div>
                    <div className="grid grid-cols-2 gap-10">
                        <InputPro type="number" name="pay" value={pay} isLabel label="Pago" onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setPay(Number(e.target.value))} />
                        <InputPro type="number" name="" disabled={true} value={totalAdjusted <= pay ? Math.abs(totalAdjusted - pay).toFixed(2) : 0} isLabel label="Vuelto" />
                    </div>

                </div>
                <div className='md:col-start-10 md:col-end-13 col-span-12'>
                    <div className="col-start-1 col-end-13">
                        {/* MÉTODOS DE PAGO - Solo para comprobantes informales */}
                        {esComprobanteInformal && formValues?.comprobante !== "NOTA DE CREDITO" && (
                            <div className="mb-5">
                                <label className="font-bold text-sm text-gray-700 mb-2 block">
                                    MÉTODO DE PAGO
                                </label>
                                <div className="grid grid-cols-3 gap-4">
                                    {/* MÉTODOS AL CONTADO */}
                                    {[
                                        { key: 'Efectivo', src: 'https://img.freepik.com/vector-premium/efectivo-mano-logotipo-empresario-blanco_269543-105.jpg' },
                                        { key: 'Yape', src: 'https://marketing-peru.beglobal.biz/wp-content/uploads/2025/01/logo-yape-bolivia.jpeg' },
                                        { key: 'Plin', src: 'https://logosenvector.com/logo/img/plin-interbank-4391.png' },
                                    ].map(({ key, src }) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setPaymentMethod(key as any)}
                                            className={`p-2 cursor-pointer justify-center rounded-lg flex border-2 transition-all ${paymentMethod === key
                                                ? 'border-blue-500 bg-blue-100 shadow-md'
                                                : 'border-gray-300 hover:border-blue-300'
                                                }`}
                                            title={`${key} - Pago al contado`}
                                        >
                                            <div className="flex flex-col items-center">
                                                <img src={src} alt={key} className="w-12 h-12 object-cover mb-1" />
                                                <span className="text-xs font-semibold text-gray-700">{key}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                {/* MÉTODOS A CRÉDITO */}
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-xs text-gray-600 mb-2">O a crédito:</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { key: 'Transferencia', icon: '🏦', desc: 'Transferencia bancaria' },
                                            { key: 'Tarjeta', icon: '💳', desc: 'Tarjeta de crédito' },
                                        ].map(({ key, icon, desc }) => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setPaymentMethod(key as any)}
                                                className={`p-2 cursor-pointer rounded-lg border-2 transition-all ${paymentMethod === key
                                                    ? 'border-orange-500 bg-orange-100 shadow-md'
                                                    : 'border-gray-300 hover:border-orange-300'
                                                    }`}
                                                title={desc}
                                            >
                                                <div className="flex flex-col items-center">
                                                    <span className="text-2xl mb-1">{icon}</span>
                                                    <span className="text-xs font-semibold text-gray-700">{key}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* INDICADOR DE TIPO DE PAGO */}
                                <div className="mt-3 p-2 rounded-lg bg-gray-50 border border-gray-200">
                                    <p className="text-xs text-gray-600">
                                        {esPagoAlContado ? (
                                            <span className="text-green-600 font-semibold">✓ Pago al contado - Estado: COMPLETADO</span>
                                        ) : (
                                            <span className="text-orange-600 font-semibold">⏳ Pago a crédito - Estado: PENDIENTE_PAGO</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        )}
                        {/* SECCIÓN DE TOTALES - Mantener igual para formales */}
                        {
                            formValues?.comprobante !== "NOTA DE CREDITO" && (
                                <label className="font-bold text-sm text-gray-700 mb-2 block">
                                    MÉTODO DE PAGO
                                </label>
                            )
                        }
                        <div className="grid grid-cols-3 gap-4 col-start-1 col-end-2 mb-5">
                            {/* Solo mostrar botones de pago antiguo si es FORMAL */}

                            {!esComprobanteInformal && formValues?.comprobante !== "NOTA DE CREDITO" && (
                                <>
                                    {[
                                        { key: 'Efectivo', src: 'https://img.freepik.com/vector-premium/efectivo-mano-logotipo-empresario-blanco_269543-105.jpg' },
                                        { key: 'Yape', src: 'https://marketing-peru.beglobal.biz/wp-content/uploads/2025/01/logo-yape-bolivia.jpeg' },
                                        { key: 'Plin', src: 'https://logosenvector.com/logo/img/plin-interbank-4391.png' },
                                    ].map(({ key, src }) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setPaymentMethod(key as any)}
                                            className={`p-2 cursor-pointer justify-center rounded-lg flex border-2 transition-all ${paymentMethod === key
                                                ? 'border-blue-500 bg-blue-100 shadow-md'
                                                : 'border-gray-300 hover:border-blue-300'
                                                }`}
                                        >
                                            <div className="flex flex-col items-center">
                                                <img src={src} alt={key} className="w-12 h-12 object-cover mb-1" />
                                                <span className="text-xs font-semibold text-gray-700">{key}</span>
                                            </div>
                                        </button>
                                    ))}
                                </>
                            )}
                        </div>
                        {(hasDiscount || (isDiscountGlobalApplicable && descountGlobal > 0)) && (
                            <div className="flex  px-2  justify-between items-center mb-3">
                                <label className="font-bold text-[#4d4d4d] text-[13px]" htmlFor="">
                                    DESCUENTO
                                </label>
                                <p className="text-[14px] font-medium text-[#4d4d4d]">{finalDiscount.toFixed(2)}</p>
                            </div>
                        )}
                        <div className="flex justify-between px-2 items-center mb-3">
                            <label className="font-bold text-[#4d4d4d] text-[13px]" htmlFor="">
                                OP GRAVADA
                            </label>
                            <p className="text-[14px] font-medium text-[#4d4d4d]">{opGravadaAdjusted.toFixed(2)}</p>
                        </div>
                        <div className="flex justify-between px-2 items-center mb-3">
                            <label className="font-bold text-[#4d4d4d] text-[13px]" htmlFor="">
                                IGV
                            </label>
                            <p className="text-[14px] font-medium text-[#4d4d4d]">{igvAdjusted.toFixed(2)}</p>
                        </div>
                        <div className="flex justify-between px-2 items-center">
                            <label className="font-bold text-[#4d4d4d] text-[13px]" htmlFor="">
                                IMPORTE TOTAL
                            </label>
                            <p className="text-[14px] font-medium text-[#4d4d4d]">{totalAdjusted.toFixed(2)}</p>
                        </div>
                        {
                            formValues?.comprobante === "NOTA DE CREDITO" && (
                                <div className='flex justify-between items-center px-2 py-2 rounded-md  mt-3'>
                                    <label className='font-bold text-[#222] text-[13px]' htmlFor=''>
                                        IMPORTE REFERENCIAL
                                    </label>
                                    <p className='text-[14px] font-medium text-[#222]'>{importReference.toFixed(2) || importeReferencial.toFixed(2)}</p>
                                </div>
                            )
                        }
                    </div>

                </div>
                <div className='md:col-start-1 md:col-end-13 col-span-12 mt-0 mb-5 grid grid-cols-12 border-t border-[#CACACA] pt-5'>
                    <div className="md:col-start-1 md:col-end-4 col-span-12">
                        <Button
                            onClick={() => handleOpenNewTab("vista previa")}
                            color="success"
                        >
                            Vista previa
                        </Button>
                    </div>
                    <div className="md:col-start-8 gap-5 md:col-end-13 col-span-12 grid grid-cols-2 mt-5 md:mt-0 md:flex md:justify-end">

                        <Button
                            onClick={() => navigate('/administrador/facturacion/comprobantes')}
                            color="danger"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={addInvoiceReceipt}
                            color="primary"
                        >
                            {isMobile ? "Emitir" : "Emitir comprobante"}
                        </Button>
                    </div>
                </div>
            </div>
            {IsOpenModalSuccessInvoice && <ModalReponseInvoice handleOpenNewTab={() => handleOpenNewTab("")} closeModal={closeModalResponse} isLoading={isLoading} comprobante={formValues?.comprobante} auth={auth} serie={serie} correlative={correlative} dataReceipt={dataReceipt} client={selectedClient} company={auth} productsInvoice={productsInvoice} formValues={formValues} observation={formValues?.observaciones} />}
            {isOpenModalProduct && <ModalProduct setSelectProduct={setSelectProduct} isInvoice initialForm={initialFormProduct} setErrors={setErrorsProduct} setFormValues={setFormValuesProduct} isOpenModal={isOpenModalProduct} errors={errorsProduct} formValues={formValuesProduct} isEdit={false} setIsOpenModal={setIsOpenModalProduct} closeModal={closeModal} />}
            {isOpenModalClient && <ModalClient isOpenModal={isOpenModalClient} errors={errorsClient} setErrors={setErrorsClient} formValues={formValuesClient} setFormValues={setFormValuesClient} isEdit={false} setIsOpenModal={setIsOpenModalClient} closeModal={closeModal} />}
        </div>
    )
}

export default Invoice;