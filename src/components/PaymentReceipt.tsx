import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { PaymentType } from '@/hooks/usePaymentFlow';
import Button from './Button';
import { Icon } from '@iconify/react';

interface IPaymentReceiptProps {
  comprobante: any;
  payment: {
    tipo: PaymentType;
    monto: number;
    medioPago: string;
    observacion?: string;
    referencia?: string;
  };
  numeroRecibo: string;
  saldo: any;
  nuevoSaldo: number;
  company: any;
  detalles?: any[];
  cliente?: any;
  pagosHistorial?: any[];
  totalPagado?: number;
  comprobanteDetails?: any;
  onClose?: () => void;
  onPrint?: () => void;
}

const PaymentReceipt = ({
  comprobante,
  saldo,
  payment,
  numeroRecibo,
  nuevoSaldo,
  company,
  detalles,
  cliente,
  onClose,
  onPrint,
}: IPaymentReceiptProps) => {
  const componentRef = useRef(null);
  const logoDataUrl = company?.empresa?.logo ? `data:image/png;base64,${company.empresa.logo}` : '';
  const fechaActual = new Date();
  const horaActual = fechaActual.toLocaleTimeString();
  const fechaFormato = fechaActual.toLocaleDateString();

  const printFn = useReactToPrint({
    // @ts-ignore
    contentRef: componentRef,
    pageStyle: `@media print {
      @page {
        size: 80mm 297mm;
        margin: 0;
      }
      body {
        width: 80mm;
        height: 297mm;
        overflow: hidden;
      }
      .p-5 {
        width: 100%;
        height: 100%;
        box-sizing: border-box;
      }
    }`,
  });

  const getTitleByType = () => {
    switch (payment.tipo) {
      case 'ADELANTO':
        return 'RECIBO DE ADELANTO';
      case 'PAGO_PARCIAL':
        return 'RECIBO DE PAGO PARCIAL';
      case 'PAGO_TOTAL':
        return 'RECIBO DE PAGO TOTAL';
      default:
        return 'RECIBO DE PAGO';
    }
  };

  const getStatusMessage = () => {
    if (payment.tipo === 'ADELANTO') {
      return `Se ha registrado un adelanto de S/ ${payment.monto.toFixed(2)}`;
    } else if (payment.tipo === 'PAGO_TOTAL') {
      return 'Comprobante pagado en su totalidad';
    } else {
      return `Pago parcial registrado. ${nuevoSaldo > 0 ? `Saldo pendiente: S/ ${nuevoSaldo.toFixed(2)}` : 'Comprobante pagado en su totalidad'}`;
    }
  };

  const handlePrint = () => {
    printFn();
    onPrint?.();
  };


  console.log("ESTE ES EL COMPROBANTE", comprobante)

  console.log("EL SALDO", saldo)

  console.log(comprobante?.data?.serie)

  console.log(comprobante?.data?.correlativo)
  console.log(detalles)
  console.log("nuevoSaldo",nuevoSaldo)
  return (
    <>
      <div className="hidden">
        <div ref={componentRef} className="print-area p-5 text-sm">
          <div>
            {logoDataUrl && <img src={logoDataUrl} alt="logo" className="mx-auto w-16 h-16" />}
            <h2 className="text-center text-xs ">{company?.empresa?.nombreComercial?.toUpperCase()}</h2>
            <p className="text-center text-xs">
              RAZON SOCIAL: {company?.empresa?.razonSocial?.toUpperCase()}<br />
              DIRECCION: {company?.empresa?.direccion?.toUpperCase()}<br />
              RUC: {company?.empresa?.ruc?.toUpperCase()}
            </p>
            <hr className="my-1 border-dashed border-[#222]" />

            <h2 className="text-center text-xs">{getTitleByType()}</h2>
            <hr className="my-1 border-dashed border-[#222]" />

            <div className="text-center text-xs mb-2">
              <p><span className="">Recibo Nro:</span> {numeroRecibo}</p>
              <p><span className="">Fecha:</span> {fechaFormato} {horaActual}</p>
            </div>
            <hr className="my-1 border-dashed border-[#222]" />

            <div className="text-xs mb-2">
              <p><span className="">Comprobante Original:</span></p>
              <p className="">Serie - Nro: {comprobante?.serie || comprobante?.data?.serie}-{comprobante?.correlativo || comprobante?.data?.correlativo}</p>
              <p className="capitalize">Cliente: {(cliente || comprobante?.cliente?.toLowerCase() || comprobante?.data?.cliente)?.nombre?.toLowerCase()}</p>
              <p className="">RUC/DNI: {(comprobante?.data?.cliente)?.nroDoc}</p>
            </div>
            <hr className="my-1 border-dashed border-[#222]" />
            
            {/* Productos/Servicios */}
            <div className="">
                            <div className="flex text-center">
                                <span className="w-1/5 text-xs">Cant.</span>
                                <span className="w-3/5 text-xs">Descripción</span>
                                <span className="w-1/5 text-xs">P.U.</span>
                                <span className="w-1/5 text-xs">Importe</span>
                            </div>
                            {comprobante?.data?.detalles?.map((item: any, i: any) => (
                                <div key={i} className="flex">
                                    <span className="w-1/5 text-xs text-center">{item?.cantidad || 0}</span>
                                    <span className="w-3/5 text-xs text-left capitalize">{item?.descripcion?.toLowerCase()|| ''}</span>
                                    <span className="w-1/5 text-xs text-left">{Number(item?.producto?.precioUnitario || 0).toFixed(2)}</span>
                                    <span className="w-1/5 text-xs text-right">{Number(item?.producto?.precioUnitario * item?.cantidad || 0).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
            <hr className="my-1 border-dashed border-[#222]" />
            <div className="text-xs mb-2">
              <p className="flex justify-between">
                <span className="">Total Comprobante:</span>
                <span className="">S/ {Number(comprobante?.mtoImpVenta > 0 ? comprobante?.mtoImpVenta : comprobante?.data?.mtoImpVenta || 0).toFixed(2)}</span>
              </p>
              {/* {totalPagado !== undefined && (
                <p className="flex justify-between">
                  <span className="">Total Pagado Anteriormente:</span>
                  <span>S/ {Number(totalPagado - payment.monto).toFixed(2)}</span>
                </p>
              )} */}
              <p className="flex justify-between">
                <span className="">
                  {payment.tipo === 'ADELANTO' ? 'Saldo Antes de Adelanto:' : 'Saldo Anterior:'}
                </span>
                <span>S/ {typeof saldo === 'number' && saldo > 0 ? Number(saldo + payment.monto).toFixed(2) : Number(comprobante?.data?.saldo + payment.monto).toFixed(2)}</span>
              </p>
            </div>
            <hr className="my-1 border-dashed border-[#222]" />

            <div className="text-xs mb-2">
              <p className="flex justify-between  text-sm bg-gray-100">
                <span className="text-[12px]">{payment.tipo === 'ADELANTO' ? 'Adelanto:' : 'Monto Pagado:'}</span>
                <span className="text-[12px]">S/ {Number(payment.monto).toFixed(2)}</span>
              </p>
              <p className="flex justify-between mt-1">
                <span className="">Método de Pago:</span>
                <span>{payment.medioPago?.toUpperCase()}</span>
              </p>
              {payment.referencia && (
                <p className="flex justify-between mt-1">
                  <span className="">{payment.medioPago === 'Tarjeta' ? 'N° Operación:' : 'Referencia:'}:</span>
                  <span>{payment.referencia}</span>
                </p>
              )}
              {payment.observacion && (
                <div className="mt-1">
                  <p className="">Observación:</p>
                  <p className="text-xs">{payment.observacion}</p>
                </div>
              )}
            </div>
            <hr className="my-1 border-dashed border-[#222]" />

            <div className="text-xs">
              <p className="text-center ">
                {payment.tipo === 'ADELANTO' ? 'Nuevo Saldo a Pagar:' : 'Nuevo Saldo Pendiente:'}
              </p>
              <p className="text-center text-md ">
                S/ {nuevoSaldo > 0 ? nuevoSaldo.toFixed(2) : nuevoSaldo === 0 && Number(comprobante?.data?.saldo).toFixed(2) || Number(saldo).toFixed(2)}
              </p>
            </div>

            <hr className="my-1 border-dashed border-[#222]" />
            <p className="text-xs text-center mt-4">
              Este comprobante acredita el {getTitleByType().toLowerCase()}.<br />
              Autorizado mediante Resolución de Intendencia<br />
              N° 080-005-000153/SUNAT.
            </p>
          </div>
        </div>
      </div>

      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800">Recibo de Pago</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <Icon icon="tabler:x" width="24" height="24" />
            </button>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
            <p className="text-sm mb-3 font-bold">{getTitleByType()}</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Comprobante:</span>
                <span className="font-semibold">{comprobante?.serie || comprobante?.data?.serie}-{comprobante?.correlativo || comprobante?.data?.correlativo}</span>
              </div>
              <div className="flex justify-between">
                <span>Cliente:</span>
                <span className="font-semibold">{(cliente || comprobante?.cliente || comprobante?.data?.cliente)?.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Comprobante:</span>
                <span className="font-semibold">{'S/ ' + (comprobante?.data?.mtoImpVenta || comprobante?.mtoImpVenta)?.toFixed(2)}</span>
              </div>
              <hr className="" />
              <div className="flex font-semibold justify-between">
                <span className="">Monto Pagado:</span>
                <span className="">S/ {payment.monto?.toFixed(2)}</span>
              </div>
              <div className="flex font-semibold justify-between">
                <span className="">Nuevo Saldo:</span>
                <span className="">{nuevoSaldo > 0 ? 'S/ ' + nuevoSaldo?.toFixed(2) : (nuevoSaldo === 0 && comprobante?.data?.saldo === 0)  ? 'S/ ' + Number(0).toFixed(2) || Number(comprobante?.data?.saldo).toFixed(2) : typeof saldo === 'number' && saldo > 0 ? 'S/ ' + saldo?.toFixed(2) : saldo}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {getStatusMessage()}
              </p>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button onClick={onClose} color="secondary" className="flex-1">
              Cerrar
            </Button>
            <Button onClick={handlePrint} color="primary" className="flex-1">
              <Icon icon="mingcute:print-line" width="18" height="18" className="inline mr-2" />
              Imprimir
            </Button>
            {/* Botón de impresión térmica (solo se muestra en macOS) */}
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentReceipt;
