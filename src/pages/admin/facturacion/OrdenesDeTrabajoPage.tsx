import { ChangeEvent, useEffect, useRef, useState } from 'react';
import DataTable from '@/components/Datatable';
import { Icon } from '@iconify/react/dist/iconify.js';
import Pagination from '@/components/Pagination';
import useAlertStore from '@/zustand/alert';
import TableSkeleton from '@/components/Skeletons/table';
import { IInvoicesState, useInvoiceStore } from '@/zustand/invoices';
import { IInvoices } from '@/interfaces/invoices';
import moment from 'moment';
import { numberToWords } from '@/utils/numberToLetters';
import { useAuthStore } from '@/zustand/auth';
import QRCode from 'qrcode';
import { Calendar } from '@/components/Date';
import Select from '@/components/Select';
import ModalConfirm from '@/components/ModalConfirm';
import { useDebounce } from '@/hooks/useDebounce';
import InputPro from '@/components/InputPro';
import ComprobantePrintPage from './comprobanteImprimir';
import { useReactToPrint } from 'react-to-print';
import { usePaymentFlow, PaymentType } from '@/hooks/usePaymentFlow';
import ModalPaymentUnified from '@/components/ModalPaymentUnified';
import PaymentReceipt from '@/components/PaymentReceipt';

const print = [{ id: 1, value: 'TICKET' }, { id: 2, value: 'A5' }, { id: 3, value: 'A4' }];

const OrdenesDeTrabajoPage = () => {
  const { auth } = useAuthStore();
  const { getAllInvoices, totalInvoices, invoices, getInvoice, invoice, resetInvoice, cancelInvoice, completePay }: IInvoicesState = useInvoiceStore();
  const { success } = useAlertStore();
  const paymentFlow = usePaymentFlow();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [searchClient, setSearchClient] = useState<string>('');
  const [formValues, setFormValues] = useState<any>({});
  const [isOpenModalConfirm, setIsOpenModalConfirm] = useState(false);
  const [isOpenModalPayment, setIsOpenModalPayment] = useState(false);
  const [paymentType, setPaymentType] = useState<PaymentType>('PAGO_PARCIAL');
  const [fechaInicio, setFechaInicio] = useState<string>(moment(new Date()).format('YYYY-MM-DD'));
  const [fechaFin, setFechaFin] = useState<string>(moment(new Date()).format('YYYY-MM-DD'));
  const [stateOT, setStateOT] = useState<string>('TODOS');
  const [printSize, setPrintSize] = useState('TICKET');

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const pages = [];
  for (let i = 1; i <= Math.ceil(totalInvoices / itemsPerPage); i++) {
    pages.push(i);
  }

  const debounce = useDebounce(searchClient, 1000);

  useEffect(() => {
    if (success === true) {
      setIsOpenModalPayment(false);
    }
  }, [success]);

  const productsTable = invoices?.map((item: IInvoices) => ({
    id: item?.id,
    fechaEmisión: moment(item?.fechaEmision).format('DD/MM/YYYY HH:mm:ss'),
    serie: item.serie,
    correlativo: item.correlativo,
    numeroOT: item.numeroOrdenTrabajo,
    cliente: item?.cliente?.nombre,
    total: `S/ ${item.mtoImpVenta.toFixed(2)}`,
    saldo: `S/ ${item?.saldo?.toFixed(2) || (0).toFixed(2)}`,
    estado: item.estadoPago,
  }));

  useEffect(() => {
    resetInvoice();
  }, []);

  const handleGetReceipt = async (data: any) => {
    await getInvoice(data.id);
  };

  useEffect(() => {
    if (invoice !== null) {
      setTimeout(() => {
        if (componentRef?.current) {
          printFn();
        }
      }, 500);
    }
  }, [invoice]);

  const handleAnular = (data: any) => {
    setFormValues(data);
    setIsOpenModalConfirm(true);
  };

  const handleInitiatePayment = (data: any, type: PaymentType) => {
    setFormValues(data);
    setPaymentType(type);
    const saldoActual = parseFloat(data?.saldo?.replace('S/ ', '') || 0);
    paymentFlow.initiatePayment(type, data, saldoActual);
    setIsOpenModalPayment(true);
  };

  const handleAdelanto = (data: any) => handleInitiatePayment(data, 'ADELANTO');
  const handlePagoParcial = (data: any) => handleInitiatePayment(data, 'PAGO_PARCIAL');
  const handlePagoTotal = (data: any) => handleInitiatePayment(data, 'PAGO_TOTAL');

  const handleConfirmPago = async (monto: number, medioPago: string) => {
    try {
      const result = await paymentFlow.processPayment(
        { tipo: paymentType, monto, medioPago: medioPago as any },
        formValues,
        (data, medioPago, monto) => completePay(data, medioPago, monto)
      );

      if (result.success) {
        setIsOpenModalPayment(false);
        setTimeout(() => {
          getAllInvoices({
            tipoComprobante: 'ORDEN_TRABAJO',
            page: currentPage,
            limit: itemsPerPage,
            search: debounce,
            fechaInicio: fechaInicio,
            fechaFin: fechaFin,
            estadoPago: stateOT !== 'TODOS' ? stateOT : '',
          });
          paymentFlow.closeReceipt();
        }, 500);
      }
    } catch (error) {
      console.error('Error al procesar pago:', error);
    }
  };

  const actions: any = [
    {
      onClick: handleGetReceipt,
      className: 'edit',
      icon: <Icon color="#3BAED9" icon="mingcute:print-line" />,
      tooltip: 'Imprimir',
    },
    {
      onClick: handleAdelanto,
      className: 'adelanto',
      icon: <Icon icon="tabler:coin" width="21" height="21" color="#FFA500" />,
      tooltip: 'Adelanto',
      condition: (row: any) => {
        const saldo = parseFloat(row.saldo.replace('S/ ', '')) || 0;
        return saldo > 0 && row.estado !== 'ANULADO' && row.estado !== 'COMPLETADO';
      },
    },
    {
      onClick: handlePagoParcial,
      className: 'pago-parcial',
      icon: <Icon icon="tdesign:money" width="21" height="21" color="#42A5F5" />,
      tooltip: 'Pago Parcial',
      condition: (row: any) => {
        const saldo = parseFloat(row.saldo.replace('S/ ', '')) || 0;
        return saldo > 0 && row.estado !== 'ANULADO' && row.estado !== 'COMPLETADO';
      },
    },
    {
      onClick: handlePagoTotal,
      className: 'pago-total',
      icon: <Icon icon="tabler:check-circle" width="21" height="21" color="#10B981" />,
      tooltip: 'Pago Total',
      condition: (row: any) => {
        const saldo = parseFloat(row.saldo.replace('S/ ', '')) || 0;
        return saldo > 0 && row.estado !== 'ANULADO' && row.estado !== 'COMPLETADO';
      },
    },
    {
      onClick: handleAnular,
      className: 'anular',
      icon: <Icon icon="line-md:file-cancel-filled" width="21" height="21" color="#FF8F6B" />,
      tooltip: 'Anular',
      condition: (row: any) => {
        return row.estado !== 'ANULADO' && row.estado !== 'COMPLETADO';
      },
    },
  ];

  useEffect(() => {
    const params: any = {
      tipoComprobante: 'ORDEN_TRABAJO',
      page: currentPage,
      limit: itemsPerPage,
      search: debounce,
      fechaInicio: fechaInicio,
      fechaFin: fechaFin,
    };
    if (stateOT !== 'TODOS') {
      params.estadoPago = stateOT;
    }
    getAllInvoices(params);
  }, [debounce, currentPage, itemsPerPage, fechaInicio, fechaFin, stateOT]);

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    const generateQR = async () => {
      try {
        const dataUrl = await QRCode.toDataURL('204812192919', {
          width: 90,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' },
          errorCorrectionLevel: 'H',
        });
        setQrCodeDataUrl(dataUrl);
      } catch (err) {
        console.error('Error al generar QR:', err);
      }
    };
    generateQR();
  }, []);

  const [dimensions, setDimensions] = useState({ width: 80, height: 297 });

  useEffect(() => {
    switch (printSize) {
      case 'TICKET':
        setDimensions({ width: 80, height:300 });
        break;
      case 'A5':
        setDimensions({ width: 148, height: 210 });
        break;
      case 'A4':
        setDimensions({ width: 210, height: 297 });
        break;
      default:
        setDimensions({ width: 210, height: 297 });
    }
  }, [printSize]);

  const componentRef = useRef(null);
  const printFn = useReactToPrint({
    contentRef: componentRef as any,
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

  const handleDate = (date: string, name: string) => {
    if (!moment(date, 'DD/MM/YYYY', true).isValid()) return;
    if (name === 'fechaInicio') {
      setFechaInicio(moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD'));
    } else if (name === 'fechaFin') {
      setFechaFin(moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD'));
    }
  };

  const handleSelectState = (_id: string, value: string) => {
    setStateOT(value);
  };

  const handleSelectPrint = (value: any) => {
    setPrintSize(value);
  };

  const handleChangeSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchClient(e.target.value);
  };

  const confirmCancelInvoice = () => {
    cancelInvoice(formValues?.id);
    setIsOpenModalConfirm(false);
  };

  const estadosOT = [
    { id: 1, value: 'TODOS' },
    { id: 2, value: 'COMPLETADO' },
    { id: 3, value: 'PENDIENTE_PAGO' },
    { id: 4, value: 'ANULADO' },
  ];

  return (
    <div className="px-0 py-0 md:px-8 md:py-4">
      <ComprobantePrintPage
        company={auth}
        componentRef={componentRef}
        formValues={invoice}
        size={printSize}
        serie={invoice?.serie}
        correlative={invoice?.correlativo}
        productsInvoice={invoice?.detalles}
        total={Number(invoice?.mtoImpVenta).toFixed(2)}
        mode="off"
        qrCodeDataUrl={qrCodeDataUrl}
        discount={invoice?.discount}
        receipt={invoice?.comprobante}
        selectedClient={invoice?.cliente}
        totalInWords={numberToWords(parseFloat(invoice?.mtoImpVenta)) + ' SOLES'}
        observation={invoice?.observaciones}
      />
      <div className="md:p-10 px-4 pt-0 z-0 md:px-8 bg-white rounded-lg">
        <div className="mb-5 pt-5 md:pt-0">
          <div className="grid grid-cols-12 gap-3 justify-between items-center">
            <div className="md:col-start-1 md:col-end-5 col-span-12">
              <InputPro name="" onChange={(e: any) => handleChangeSearch(e.target.value)} isLabel label="Buscar OT, cliente, nro" />
            </div>
            <div className="md:col-start-5 md:col-end-13 col-span-12 grid gap-3">
              <div className="md:col-start-1 md:col-end-3 col-span-12">
                <Calendar text="Fecha inicio" name="fechaInicio" onChange={handleDate} />
              </div>
              <div className="md:col-start-3 md:col-end-5 col-span-12">
                <Calendar text="Fecha Fin" name="fechaFin" onChange={handleDate} />
              </div>
              <div className="md:col-start-5 md:col-end-7 col-span-12">
                <Select onChange={handleSelectState} label="Estado" name="" options={estadosOT} error="" />
              </div>
              <div className="md:col-start-7 md:col-end-10 col-span-12">
                <Select onChange={handleSelectPrint} label="Tamaño" name="" defaultValue={printSize} options={print} error="" />
              </div>
            </div>
          </div>
        </div>
        <div className="w-full">
          {productsTable?.length > 0 ? (
            <>
              <div className="overflow-hidden overflow-x-scroll md:overflow-x-visible">
                <DataTable
                  actions={actions}
                  bodyData={productsTable}
                  headerColumns={['Fecha', 'Serie', 'Nro.', 'OT', 'Cliente', 'Importe', 'Saldo', 'Estado']}
                />
              </div>
              <Pagination
                data={productsTable}
                optionSelect
                currentPage={currentPage}
                indexOfFirstItem={indexOfFirstItem}
                indexOfLastItem={indexOfLastItem}
                setcurrentPage={setCurrentPage}
                setitemsPerPage={setItemsPerPage}
                pages={pages}
                total={totalInvoices}
              />
            </>
          ) : (
            <TableSkeleton arrayData={productsTable} />
          )}
        </div>
        {isOpenModalConfirm && (
          <ModalConfirm
            confirmSubmit={confirmCancelInvoice}
            information="¿Estás seguro que deseas anular esta orden?"
            isOpenModal
            setIsOpenModal={() => setIsOpenModalConfirm(false)}
            title="Anular Orden de Trabajo"
          />
        )}
        {isOpenModalPayment && (
          <ModalPaymentUnified
            isOpen={isOpenModalPayment}
            isLoading={paymentFlow.isLoading}
            paymentType={paymentType}
            saldoPendiente={parseFloat(formValues?.saldo?.replace('S/ ', '') || 0)}
            totalComprobante={parseFloat(formValues?.total?.replace('S/ ', '') || 0)}
            comprobanteInfo={{
              id: formValues.id,
              serie: formValues.serie,
              correlativo: formValues.correlativo,
              cliente: formValues.cliente,
              total: parseFloat(formValues?.total?.replace('S/ ', '') || 0),
            }}
            onConfirm={handleConfirmPago}
            onCancel={() => {
              setIsOpenModalPayment(false);
              paymentFlow.reset();
            }}
            error={paymentFlow.error || ''}
          />
        )}
        {paymentFlow.showReceipt && paymentFlow.receiptData && (
          <PaymentReceipt
            comprobante={formValues}
            saldo={formValues?.saldo}
            payment={paymentFlow.payment!}
            numeroRecibo={paymentFlow.receiptData.numeroRecibo}
            nuevoSaldo={paymentFlow.receiptData.nuevoSaldo}
            company={auth}
            onClose={() => {
              paymentFlow.reset();
              setIsOpenModalPayment(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default OrdenesDeTrabajoPage;
