import { ChangeEvent, useEffect, useRef, useState } from "react";
import Input from "@/components/Input";
import DataTable from "@/components/Datatable";
import { Icon } from "@iconify/react/dist/iconify.js";
import ModalConfirm from "@/components/ModalConfirm";
import { IFormProduct, IProduct } from "@/interfaces/products";
import Pagination from "@/components/Pagination";
import useAlertStore from "@/zustand/alert";
import { IProductsState, useProductsStore } from "@/zustand/products";
import TableSkeleton from "@/components/Skeletons/table";
import { useAuthStore } from "@/zustand/auth";
import { useDebounce } from "@/hooks/useDebounce";
import ModalProduct from "./modal-productos";
import ModalCategories from "./modal-categorias";
import Button from "@/components/Button";
import InputPro from "@/components/InputPro";

const KardexProductos = () => {

    const { getAllProducts, totalProducts, products, toggleStateProduct, exportProducts, importProducts }: IProductsState = useProductsStore();
    const { success } = useAlertStore();
    const { auth } = useAuthStore();
    const [isHoveredExp, setIsHoveredExp] = useState(false);
    const [isHoveredImp, setIsHoveredImp] = useState(false);
    const [currentPage, setcurrentPage] = useState(1);
    const [itemsPerPage, setitemsPerPage] = useState(50);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const pages = [];
    for (let i = 1; i <= Math.ceil(totalProducts / itemsPerPage); i++) {
        pages.push(i);
    }

    const initialForm: IFormProduct = {
        productoId: 0,
        descripcion: "",
        categoriaId: "",
        precioUnitario: 0,
        categoriaNombre: "",
        afectacionNombre: "Gravado – Operación Onerosa",
        tipoAfectacionIGV: "10",
        stock: 50,
        stockMinimo: 0,
        stockMaximo: 0,
        codigo: "",
        unidadMedidaId: 1,
        unidadMedidaNombre: "UNIDAD",
        estado: "",
        costoPromedio: 0,
        costoUnitario: 0
    }

    const [isOpenModal, setIsOpenModal] = useState(false);
    const [isOpenModalCategory, setIsOpenModalCategory] = useState(false);
    const [isOpenModalConfirm, setIsOpenModalConfirm] = useState(false);
    const [searchClient, setSearchClient] = useState<string>("");
    const [formValues, setFormValues] = useState<IFormProduct>(initialForm);
    const [isEdit, setIsEdit] = useState(false);
    const [errors, setErrors] = useState({
        codigo: "",
        descripcion: "",
        categoriaId: 0,
        description: "",
        precioUnitario: "",
        stock: "",
        unidadMedida: ""
    });
    const debounce = useDebounce(searchClient, 1000);

    const handleGetProduct = async (data: any) => {
        setIsOpenModal(true);
        setIsEdit(true);
        
        // Buscar el producto original para obtener datos completos
        const originalProduct = products.find(p => p.id === data.productoId);
        
        setFormValues({
            ...data,
            precioUnitario: data.precioUnitario.replace("S/ ", ""),
            costoUnitario: originalProduct?.costoUnitario || originalProduct?.costoPromedio || 0,
            costoPromedio: originalProduct?.costoPromedio || 0,
            stockMinimo: (data?.stockMinimo ?? originalProduct?.stockMinimo) || 0,
            stockMaximo: (data?.stockMaximo ?? originalProduct?.stockMaximo) || 0,
        });
    };

    useEffect(() => {
        if (success === true) {
            setIsOpenModal(false);
            setIsEdit(false)
        }
    }, [success])

    console.log(products)

    const productsTable = products?.map((item: IProduct) => {
        const costo = Number(item?.costoUnitario > 0 ? item?.costoUnitario : item?.costoPromedio || 0);
        const precio = Number(item?.precioUnitario || 0);
        const margen = precio > 0 && costo > 0 ? ((precio - costo) / precio * 100) : 0;
        const gananciaUnidad = precio - costo;

        return {
            productoId: item?.id,
            codigo: item?.codigo,
            descripcion: item?.descripcion,
            categoriaNombre: item?.categoria?.nombre || 'Sin categoría',
            categoriaId: item?.categoriaId !== null ? "" : item?.categoria?.id,
            unidadMedidaId: item?.unidadMedida?.id || item?.unidadMedidaId,
            precioUnitario: `S/ ${precio.toFixed(2)}`,
            costoPromedio: costo > 0 ? `S/ ${costo.toFixed(2)}` : '-',
            margenGanancia: margen > 0 ? `${margen.toFixed(1)}%` : '-',
            gananciaUnidad: gananciaUnidad > 0 ? `S/ ${gananciaUnidad.toFixed(2)}` : '-',
            stock: item?.stock,
            stockMinimo: item?.stockMinimo ?? 0,
            unidadMedidaNombre: item?.unidadMedida.nombre,
   
            // Para el modal
            // costoPromedioNumerico: costo,
            // precioUnitarioNumerico: precio,
            estado: item.estado,
        }
    })

    const handleToggleClientState = async (data: any) => {
        setFormValues(data);
        setIsOpenModalConfirm(true);
    };

    const actions: any =
        [
            {
                onClick: handleGetProduct,
                className: "edit",
                icon: <Icon color="#66AD78" icon="material-symbols:edit" />,
                tooltip: "Editar"
            },
            {
                onClick: handleToggleClientState,
                className: "delete",
                icon: <Icon icon="healthicons:cancel-24px" color="#EF443C" />,
                tooltip: "Eliminar",
            }
        ]
        ;

    useEffect(() => {
        getAllProducts({
            page: currentPage,
            limit: itemsPerPage,
            search: debounce
        });
    }, [debounce, currentPage, itemsPerPage]);

    const closeModal = () => {
        setIsOpenModal(false);
        setIsOpenModalCategory(false)
        setIsEdit(false)
    }

    const handleChange = (e: any) => {
        setSearchClient(e.target.value)
    }

    const confirmToggleroduct = () => {
        toggleStateProduct(Number(formValues?.productoId))
        setIsOpenModalConfirm(false)
    }

    const handleImportExcel = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const allowedTypes = [
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ];
        if (!allowedTypes.includes(file.type)) {
            useAlertStore.getState().alert("Por favor, selecciona un archivo Excel válido (.xlsx o .xls)", "error");
            return;
        }

        await importProducts(file);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        await getAllProducts({
            page: currentPage,
            limit: itemsPerPage,
            search: debounce,
        });
    };

    return (
        <div className="px-0 py-0 md:px-8 md:py-4">
            <div className="md:p-10 px-4 pt-0 z-0 md:px-8 bg-[#fff] rounded-lg">
                {/* Header */}
                <div className="md:grid md:grid-cols-12 md:justify-between items-center mb-5 pt-5 md:pt-0">
                    <div className="md:col-start-1 md:col-end-5">
                        <InputPro name="" onChange={handleChange} label="Buscar nombre y código" isLabel />
                    </div>
                    <div className="flex justify-end gap-5 md:col-start-5 md:col-end-13 items-center mt-5 md:mt-0">
                        <Button color="lila" outline onClick={() => setIsOpenModalCategory(true)}>Categorias</Button>

                        <Button
                            color="success"
                            onMouseEnter={() => setIsHoveredExp(true)}
                            onMouseLeave={() => setIsHoveredExp(false)}
                            onClick={() => {
                                exportProducts(auth?.empresaId, debounce);
                            }}
                        >
                            <Icon
                                className="mr-4"
                                color={isHoveredExp ? '#fff' : '#00C851'}
                                icon="icon-park-outline:excel"
                                width="20"
                                height="20"
                            />
                            Exportar Exc.
                        </Button>
                        <div className="relative">
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                ref={fileInputRef}
                                onChange={handleImportExcel}
                                className="hidden"
                            />
                            <Button
                                color="success"
                                onMouseEnter={() => setIsHoveredImp(true)}
                                onMouseLeave={() => setIsHoveredImp(false)}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Icon
                                    className="mr-4"
                                    color={isHoveredImp ? '#fff' : '#00C851'}
                                    icon="icon-park-outline:excel"
                                    width="20"
                                    height="20"
                                />
                                Importar Exc.
                            </Button>
                        </div>
                        <Button color="secondary" onClick={() => {
                            setFormValues(initialForm);
                            setErrors({
                                descripcion: "",
                                categoriaId: 0,
                                description: "",
                                precioUnitario: "",
                                stock: "",
                                codigo: "",
                                unidadMedida: ""
                            });
                            setIsOpenModal(true);
                        }}>Nuevo producto</Button>

                    </div>
                </div>
                <div className='w-full'>

                    {
                        productsTable?.length > 0 ? (
                            <>
                                <div className="overflow-hidden overflow-x-scroll md:overflow-x-visible">
                                    <DataTable actions={actions} bodyData={productsTable}
                                        headerColumns={[
                                            'Código',
                                            'Producto',
                                            'Categoria',
                                            'Precio Venta',
                                            'Costo',
                                            'Margen',
                                            'Ganancia/Unidad',
                                            'Stock',
                                            'Stock minimo',
                                            'U.M',
                                            // 'Costo',
                                            'Estado'
                                        ]} />
                                </div>
                                <Pagination
                                    data={productsTable}
                                    optionSelect
                                    currentPage={currentPage}
                                    indexOfFirstItem={indexOfFirstItem}
                                    indexOfLastItem={indexOfLastItem}
                                    setcurrentPage={setcurrentPage}
                                    setitemsPerPage={setitemsPerPage}
                                    pages={pages}
                                    total={totalProducts}
                                />
                            </>
                        ) :
                            <TableSkeleton />
                    }
                </div>

                {isOpenModal && <ModalProduct
                    closeModal={closeModal}
                    errors={errors}
                    initialForm={initialForm}
                    formValues={formValues}
                    setErrors={setErrors}
                    setFormValues={setFormValues}
                    isEdit={isEdit}
                    isOpenModal={isOpenModal}
                    setIsOpenModal={setIsOpenModal}
                />}
                {isOpenModalCategory && <ModalCategories isOpenModal={isOpenModalCategory} setIsOpenModal={setIsOpenModalCategory} closeModal={closeModal} />}
                {isOpenModalConfirm && <ModalConfirm confirmSubmit={confirmToggleroduct} isOpenModal={isOpenModalConfirm} setIsOpenModal={setIsOpenModalConfirm} title="Confirmación" information="¿Estás seguro que deseas cambiar el estado de este producto?." />}
            </div>
        </div>
    );
};

export default KardexProductos;