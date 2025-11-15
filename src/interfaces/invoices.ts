export type IInvoices = {
  id: number
  ublVersion: string
  tipoOperacionId: number
  tipoDoc: string
  serie: string
  correlativo: number
  fechaEmision: string
  formaPagoTipo: string
  formaPagoMoneda: string
  tipoMoneda: string
  fechaRecojo: string
  estadoPago: string
  observaciones: string
  sunatCdrZip: string
  sunatXml: string,
  saldo: number
  numeroOrdenTrabajo: string
  mtoDescuentoGlobal: number
  mtoOperGravadas: number
  mtoIGV: number
  mtoOperInafectas: number
  s3PdfUrl: string
  valorVenta: number
  totalImpuestos: number
  subTotal: number
  mtoImpVenta: number
  estadoEnvioSunat: string
  medioPago: any
  clienteId: number
  empresaId: number
  tipDocAfectado: string
  numDocAfectado: string
  motivoId: number
  creadoEn: string
  cliente: {
    id: number
    nombre: string
    nroDoc: string
    persona: string
  }
  detalles: Array<{
    producto: {
      id: number
      descripcion: string
    }
    unidad: string
    descripcion: string
    cantidad: number
    mtoValorUnitario: number
    mtoValorVenta: number
    mtoBaseIgv: number
    porcentajeIgv: number
    igv: number
    totalImpuestos: number
    mtoPrecioUnitario: number
  }>
  leyendas: Array<{
    code: string
    value: string
  }>
  motivo: {
    codigo: string
    descripcion: string
  }
  tipoOperacion: {
    codigo: string
    descripcion: string
  }
  comprobante: string
}


export interface IFormInvoice {
  comprobante: string
  tipoDoc: string
  relatedInvoiceId: string
  vuelto: number,
  clienteNombre: string
  medioPago: string
  discount: number
  tipDocAfectado: string,
  motivoId: number,
  motivo: string
  numDocAfectado: string
  observaciones: string
  clienteId: number
  detalles: Array<{
    productId: number
    quantity: number
  }>
  currencyCode: string
}