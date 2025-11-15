import moment from 'moment';
import React, { useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

const ComprobantePrintPage = ({
    productsInvoice,
    totalInWords,
    qrCodeDataUrl,
    componentRef,
    observation,
    company,
    formValues,
    mode,
    total,
    receipt,
    selectedClient,
    discount,
    printFn,
    size,
}: any) => {


    const localComponentRef = useRef(null);

    useEffect(() => {
        // Force re-render or update logic if needed
        // This ensures the component updates when props change
    }, [productsInvoice, totalInWords, qrCodeDataUrl, observation, company, formValues, mode, total, receipt, selectedClient, discount, size]);

    const totalReceipt = productsInvoice?.reduce((sum: any, p: any) => sum + Number(p.total || p.mtoPrecioUnitario * p.cantidad || 0), 0);
    const totalPrices = productsInvoice?.reduce((sum: any, p: any) => sum + (Number(p.precioUnitario || p.mtoPrecioUnitario || 0) * (p.cantidad || 0)), 0);

    const round2 = (n: any) => parseFloat(n?.toFixed(2)) || 0;

    console.log(formValues)
    console.log(company)
    const rawBase64 = company?.empresa?.logo;
    // Detecta MIME si no viene con prefijo
    const detectMime = (b64?: string) => {
        if (!b64) return undefined;
        if (b64.startsWith('data:')) return undefined; // ya viene completo
        if (b64.startsWith('/9j/')) return 'image/jpeg'; // JPEG
        if (b64.startsWith('iVBOR')) return 'image/png'; // PNG
        return 'image/png';
    };

    const mime = detectMime(rawBase64);
    const logoDataUrl = rawBase64
        ? (rawBase64.startsWith('data:')
            ? rawBase64
            : `data:${mime};base64,${rawBase64}`)
        : undefined;

    console.log(formValues)

    return (
        <div id="print-root" className='hidden h-full bg-[#fff]'>
            <div
                ref={componentRef || localComponentRef}
                className={`px-5 bg-[#fff] py-0 text-sm ${size === 'TICKET' ? 'pt-10 pb-10' : 'pt-40 pb-40'}`}
                style={{
                    fontFamily:
                        size === 'TICKET'
                            ? 'SFMono-Regular,VT323, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
                            : 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif',
                    lineHeight: size === 'TICKET' ? 1.2 : undefined,
                    letterSpacing: size === 'TICKET' ? '0.2px' : undefined
                }}
            >
                {size === 'TICKET' ? (
                    <div className="">
                        {logoDataUrl && <img src={logoDataUrl} alt="logo" className="mx-auto w-[110px] h-[110px] mb-3" />}
                        <p className={`text-center ${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}>
                            RAZON SOCIAL: {company?.empresa?.razonSocial?.toUpperCase()}<br />
                            DIRECCION: {company?.empresa?.direccion?.toUpperCase()}<br />
                            RUC: {company?.empresa?.ruc?.toUpperCase()}
                        </p>
                        <hr className="my-1 border-dashed border-[#222]" />
                        <h2 className={`text-center font-bold ${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}>{receipt} DE VENTA ELECTRÓNICA<br />{formValues?.serie}-{formValues?.correlativo}</h2>
                        <hr className="my-1 border-dashed border-[#222]" />
                        <div>
                            <p className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}><span className="">FECHA/HORA:</span> {moment(formValues?.fechaEmision).format('DD/MM/YYYY HH:mm:ss')}</p>
                            <p className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}><span className="">RAZON SOCIAL:</span> {selectedClient?.nombre?.toUpperCase() || ''}</p>
                            <p className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}><span className="">NÚMERO DE DOCUMENTO:</span> {selectedClient?.nroDoc || ''}</p>
                            <p className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}><span className="">DIRECCION:</span> {selectedClient?.direccion?.toUpperCase() || ''}</p>
                        </div>
                        <hr className="my-1 border-dashed border-[#222]" />
                        <div className="">
                            <div className="flex text-center">
                                <span className={`w-1/5 ${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}>CANT.</span>
                                <span className={`w-3/5 ${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}>DESCRIPCION</span>
                                <span className={`w-1/5 ${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}>P.U.</span>
                                <span className={`w-1/5 ${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}>IMP.</span>
                            </div>
                            {productsInvoice?.map((item: any, i: any) => (
                                <div key={i} className="flex">
                                    <span className={`w-1/5 ${size === 'TICKET' ? 'text-[18px]' : 'text-xs'} text-center`}>{item?.cantidad || 0}</span>
                                    <span className={`w-3/5 ${size === 'TICKET' ? 'text-[18px]' : 'text-xs'} text-left`}>{item?.descripcion?.toUpperCase() || ''}</span>
                                    <span className={`w-1/5 ${size === 'TICKET' ? 'text-[18px]' : 'text-xs'} text-left`}>{Number(item?.producto?.precioUnitario || item?.precioUnitario || 0).toFixed(2)}</span>
                                    <span className={`w-1/5 ${size === 'TICKET' ? 'text-[18px]' : 'text-xs'} text-right`}>{Number((item?.producto?.precioUnitario || item?.precioUnitario) * item?.cantidad || 0).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <hr className="my-1 border-dashed border-[#222]" />
                        <p className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'} `}>SON: {totalInWords || ''}</p>
                        <hr className="my-1 border-dashed border-[#222]" />
                        <label className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'} flex justify-between`}><div className="">TOTAL GRAVADAS:</div> <div>{Number(totalReceipt * 0.82).toFixed(2)}</div></label>
                        <label className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'} flex justify-between`}><div className="">I.G.V 18.00 %:</div> <div>{Number(totalReceipt * 0.18).toFixed(2)}</div></label>
                        <label className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'} flex justify-between`}><div className="">IMPORTE TOTAL:</div> <div>{Number(totalReceipt).toFixed(2)}</div></label>
                        <hr className="my-1 border-dashed border-[#222]" />
                        <p className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}><span className="">MEDIO DE PAGO: </span>{formValues?.medioPago?.toUpperCase()}</p>
                        <p className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}><span className="">VUELTO: </span> S/ {formValues?.vuelto?.toFixed(2) || (0).toFixed(2)}</p>
                        <p className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}><span className="">PAGADO: </span>S/ {Number(totalPrices).toFixed(2)}</p>
                        <p className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}><span className="">VENDEDOR: </span>{formValues?.vendedor?.toUpperCase()}</p>
                        <hr className="my-1 border-dashed border-[#222]" />
                        <p className={`${size === 'TICKET' ? 'text-[18px]' : 'text-xs'}`}><span className="">OBSERVACIONES : </span>{observation?.toUpperCase() || ''}</p>
                        <div className="">
                            <p className={`${size === 'TICKET' ? 'text-[15px]' : 'text-xs'} text-center mt-10`}>
                                Sistema para ferreterias - FalcoNext.</p>
                            <p className={`${size === 'TICKET' ? 'text-[15px]' : 'text-xs'} text-center`}>Desarrollado por FalcoNext.</p>
                            <p className={`${size === 'TICKET' ? 'text-[15px]' : 'text-xs'} text-center`}>www.falconext.pe.</p>
                        </div>
                        <hr className="my-1 border-dashed border-[#222]" />
                        <p className={`${size === 'TICKET' ? 'text-[15px]' : 'text-xs'} text-center`}>GRACIAS POR SU COMPRA, VUELVA PRONTO !</p>
                        <hr className="my-1 border-dashed border-[#222]" />
                    </div>
                ) : (
                    <div className="w-full">
                        <div className="flex justify-between">
                            {logoDataUrl && <img src={logoDataUrl} alt="logo" className="w-[120px] h-[120px] mr-4" />}
                            <div>
                                <h6 className="text-xl font-bold">{company?.empresa?.nombreComercial.toUpperCase()}</h6>
                                <p className="text-xs">{company?.empresa?.direccion}<br />{company?.empresa?.rubro?.nombre?.toUpperCase()}<br />RAZON SOCIAL: {company?.empresa?.razonSocial}<br />CELULAR: {company?.celular}<br />EMAIL: {company?.email}</p>
                            </div>
                            <div className="border border-black px-4 pt-4 pb-2 text-center">
                                <div className="text-xs">RUC: {company?.empresa?.ruc}</div>
                                <div className="text-lg font-bold">{receipt}</div>
                                <div className='font-bold text-lg'>ELECTRONICA</div>
                                <div>{formValues?.serie}-{formValues?.correlativo}</div>
                            </div>
                        </div>
                        <div className="flex mt-4 justify-between mb-2">
                            <div>
                                <label className="text-xs mt-1 flex"><div className="font-bold w-[100px]">CLIENTE:</div> {selectedClient?.nombre?.toUpperCase() || ''}</label>
                                <label className="text-xs mt-1 flex"><div className="font-bold w-[100px]">DIRECCION:</div><p className='w-[450px]'> {selectedClient?.direccion?.toUpperCase() || '-'}</p></label>
                                <label className="text-xs mt-1 flex"><div className="font-bold w-[100px]">FORMA PAGO:</div> CONTADO</label>
                                <label className="text-xs mt-1 flex"><div className="font-bold w-[100px]">MEDIO PAGO:</div> {formValues?.medioPago?.toUpperCase()} S/ {round2(totalPrices).toFixed(2)}</label>
                            </div>
                            <div>
                                <label className="text-xs mt-1 flex"><div className="font-bold w-[110px]">RUC:</div> {selectedClient?.nroDoc || ''}</label>
                                <label className="text-xs mt-1 flex"><div className="font-bold w-[110px]">FECHA:</div> {new Date().toLocaleDateString()}</label>
                                <label className="text-xs mt-1 flex"><div className="font-bold w-[110px]">HORA:</div> {new Date().toLocaleTimeString()}</label>
                                <label className="text-xs mt-1 mb-2 flex"><div className="font-bold w-[110px]">MONEDA:</div> SOLES</label>
                            </div>
                        </div>
                        <div className="border border-[#222] mt-2">
                            <div className="flex border-b-0">
                                <span className="w-1/6 text-xs font-bold text-center">CANT.</span>
                                <span className="w-1/6 text-xs font-bold text-center">U.M.</span>
                                <span className="w-3/6 text-xs font-bold text-center">DESCRIPCION</span>
                                <span className="w-1/6 text-xs font-bold text-left">P.U.</span>
                                <span className="w-1/6 text-xs font-bold text-center">IMPORTE</span>
                            </div>
                            {productsInvoice?.map((item: any, i: any) => (
                                <div key={i} className="flex">
                                    <span className="w-1/6 text-xs text-center">{item?.cantidad || 0}</span>
                                    <span className="w-1/6 text-xs text-center">{item?.unidad?.toUpperCase() || item?.unidadMedida?.toUpperCase() || item?.producto?.unidadMedida?.codigo?.toUpperCase() || ''}</span>
                                    <span className="w-3/6 text-xs text-left">{item?.descripcion?.toUpperCase() || ''}</span>
                                    <span className="w-1/6 text-xs text-left">{Number(item?.precioUnitario || item?.producto?.precioUnitario || 0).toFixed(2)}</span>
                                    <span className="w-1/6 text-xs text-right">{Number(item?.total || (item?.cantidad * item?.producto?.precioUnitario) || 0).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-2">
                            <p className="w-1/2 text-xs font-bold">SON: {totalInWords || ''}</p>
                            <div>
                                <p className="text-xs"><span className="font-bold">IMPORTE TOTAL:</span> S/ {round2(Number(total)).toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="border border-black p-2 mt-2 relative mb-10">
                            <p className="text-xs"><span className="font-bold">OBSERVACIONES:</span><br />{observation?.toUpperCase() || ''}<br />Representación impresa del Comprobante de Pago Electrónico.<br />Autorizado mediante Resolución de Intendencia N° 080-005-000153/SUNAT.<br />Emite a través de APISPERU - Proveedor Autorizado por SUNAT.</p>
                            {qrCodeDataUrl && <img src={qrCodeDataUrl} alt="QR" className="absolute bottom-2 right-2 w-12 h-12" />}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ComprobantePrintPage;