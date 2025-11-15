
import Modal from "react-modal";
import { IInvoicesState, useInvoiceStore } from "@/zustand/invoices";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/useIsMobile";
import Button from "@/components/Button";
import { detectPlatform } from "@/utils/platformDetector";



interface IProps {
    serie: string
    correlative: string
    dataReceipt: any
    auth: any
    client: any
    comprobante: string
    isLoading: boolean
    closeModal: any
    handleOpenNewTab: any
    // Datos adicionales para impresión térmica
    company?: any
    productsInvoice?: any[]
    formValues?: any
    observation?: string
}

const ModalReponseInvoice = ({ isLoading, dataReceipt, auth, client, comprobante, closeModal, handleOpenNewTab, company, productsInvoice, formValues, observation }: IProps) => {

    console.log(company)
    console.log(productsInvoice)
    console.log(formValues)

    const { resetInvoice, resetProductInvoice }: IInvoicesState = useInvoiceStore();
    const isMobile = useIsMobile();
    const navigate = useNavigate();
    const customStyles = {
        content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            width: isMobile ? "98%" : "auto",
            maxHeight: "98%",
            border: "none",
            backgroundColor: "#fff",
            borderRadius: '10px',
            zIndex: "-1",
            marginRight: '-50%',
            padding: '0px',
            overflow: 'hidden',
            transform: 'translate(-50%, -50%)',
        }
    };

    const goListInvoice = () => {
        resetInvoice();
        resetProductInvoice();
        if (['BOLETA', 'FACTURA', 'NOTA DE CREDITO', 'NOTA DE DEBITO'].includes(comprobante)) {
            navigate('/administrador/facturacion/comprobantes')
        } else {
            navigate('/administrador/facturacion/comprobantes-informales')
        }
    }

    return (
        <Modal ariaHideApp={false} isOpen style={customStyles}>
            <div className="p-5">

                {
                    isLoading === false ? (
                        <>
                            <h2 className="font-bold">Comprobante</h2>
                            <div className="text-center">
                                <div className="mx-auto justify-center items-center w-full">
                                    <img className="mx-auto" src="/gif/suc.gif" width={120} height={120} alt="Success" />
                                </div>
                                <div className="mt-5 mb-5">
                                    <p className="text-[#3E3E3E] w-[470px] mx-auto">Hola, <strong>{auth.nombre}</strong><br />
                                        la {comprobante.toLowerCase()} del cliente <strong>{client?.nombre}</strong>
                                    </p>
                                </div>
                                <div className="">
                                    <label className="text-4xl font-medium bg-[#fff] text-[#29C570] border-dashed border border-[#29C570] rounded-md px-3 mb-3" htmlFor="">{dataReceipt?.serie}-{dataReceipt?.correlativo}</label>
                                    <p className="mt-5 text-[#3E3E3E]">Ha sido generado correctamente</p>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-5 mb-2 justify-between flex-wrap">
                                <Button color="black" outline onClick={goListInvoice}>Ir a lista de comprobantes</Button>
                                <Button color="primary" outline onClick={handleOpenNewTab}>Imprimir comprobante</Button>
                                <Button color="secondary" outline onClick={() => closeModal()}>Nueva {comprobante.toLowerCase()}</Button>
                            </div>
                        </>
                    ) :

                        <>
                            <div className="mx-auto justify-center items-center w-full">
                                <img className="mx-auto" src="/gif/loading.gif" width={200} height={200} alt="Success" />
                            </div>
                            <div>
                                <p className="mt-5 mb-5 font-bold text-[#3E3E3E] w-[300px] mx-auto text-center">Espere por favor, procesando su comprobante ...</p>
                            </div>
                        </>
                }
            </div>
        </Modal>
    )
}

export default ModalReponseInvoice;