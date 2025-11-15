import { ChangeEvent, FC } from 'react';
import styles from './../table.module.css';
import { useInvoiceStore } from '@/zustand/invoices';
import useAlertStore from '@/zustand/alert';


interface ITableBodyProps {
    data: any[];
    colorRow?: string;
    colorFont?: string;
    actions?: any[];
    formValues: any;
}

const TableBody: FC<ITableBodyProps> = ({
    data,
    formValues,
    colorFont,
    actions,
}) => {
    const { updateProductInvoice, productsInvoice } = useInvoiceStore();

    // Log para depurar productsInvoice
    console.log('productsInvoice:', productsInvoice);

    // Log para depurar data
    console.log('data:', data);

    // Función para obtener la cantidad original desde productsInvoice
    const getOriginalQuantity = (row: any) => {
        console.log('Row passed to getOriginalQuantity:', row); // Depuración
        const originalProduct = productsInvoice.find((item: any) => item.descripcion === row.descripcion);
        console.log(originalProduct)
        if (!originalProduct) {
            console.warn('Product not found in productsInvoice for id:', row.id);
            return Number(row.cantidad);
        }
        console.log(originalProduct)
        const originalQty = originalProduct.cantidadOriginal !== undefined
            ? Number(originalProduct.cantidadOriginal)
            : Number(originalProduct.cantidad);
        console.log('Cantidad original en la fila', row.id, originalQty);
        return originalQty;
    };

    // Función para manejar cambios en los inputs
    const handleInputChange = (
        index: number,
        field: string,
        value: string | number
    ) => {
        const updatedProduct = { ...data[index] };
        console.log('updatedProduct:', updatedProduct); // Depuración
        const originalQuantity = getOriginalQuantity(updatedProduct);
        console.log(originalQuantity)
        // Validar la cantidad si el campo es 'quantity'
        if (field === 'cantidad' && formValues?.motivoId === 7) {
            const newQuantity = value === '' ? 0 : Number(value); // Permitir input vacío temporalmente
            // No permitir que la cantidad sea mayor a la original
            if (newQuantity > originalQuantity) {
                useAlertStore.getState().alert("No puedes colocar un número mayor que la cantidad original", "error")
                console.log(`New quantity ${newQuantity} is greater than original ${originalQuantity}`);
                return; // No actualizar si la cantidad es mayor a la original
            }
            // No permitir valores negativos o cero
            if (newQuantity <= 0 && value !== '') {
                console.log(`New quantity ${newQuantity} is less than or equal to 0`);
                return; // No actualizar si la cantidad es menor o igual a cero
            }
            updatedProduct[field] = value === '' ? '' : newQuantity; // Mantener el valor como string si está vacío
        } else {
            updatedProduct[field] = value;
        }

        // Validar el descuento si el campo es 'descount'
        const descount = parseFloat(updatedProduct.descuento) || 0;
        if (field === 'descuento' && (descount < 0 || descount > 100)) {
            return; // No actualizar si el descuento es inválido
        }

        // Recalcular venta, IGV e importe solo si quantity no está vacío
        if (updatedProduct.cantidad !== '') {
            const unitPrice = parseFloat(updatedProduct.precioUnitario) || 0;
            const quantity = parseFloat(updatedProduct.cantidad) || 1;
            // Calcular venta (sin IGV)
            const sale = (unitPrice * quantity * (1 - descount / 100)) / 1.18;
            updatedProduct.sale = sale.toFixed(2);

            // Calcular IGV (18%)
            const igv = sale * 0.18;
            updatedProduct.igv = igv.toFixed(2);

            // Calcular importe total
            const total = sale + igv;
            updatedProduct.total = total.toFixed(2);

            // Actualizar el store
            updateProductInvoice(index, updatedProduct);
        }
    };

    console.log(actions)

    return (
        <tbody>
            {data.map((row, index) => {
                const isCanceled = formValues === undefined || row.estado === 'cancelado' || row.estado === "completado" || (formValues?.motivoId === 1 || formValues?.motivoId === 2 || formValues?.motivoId === 4 || formValues?.motivoId === 6);
                const hasAddressAndName = row.hasOwnProperty('address') && row.hasOwnProperty('name');
                const isNoteType07 = formValues?.motivoId === 7;
                const isNoteType03 = formValues?.motivoId === 3;
                const isNoteType04 = formValues?.motivoId === 4;
                const isNoteType05 = formValues?.motivoId === 5;
                const isNoteType08 = formValues?.motivoId === 8;
                const isNoteType09 = formValues?.motivoId === 9;
                const isNoteType10 = formValues?.motivoId === 10;
                return (
                    <tr
                        key={index}
                        style={{
                            backgroundColor: isCanceled ? '#24262E' : "#fff",
                            opacity: isCanceled ? 1 : 1,
                        }}
                    >
                        {Object.entries(row).map(([key, cell], cellIndex) => {
                            if (
                                key === 'cantidadOriginal' ||
                                key === 'id' ||
                                key === 'productoId' ||
                                key === 'unidadMedidaId' ||
                                key === 'categoriaId' ||
                                key === 'id_invoice' ||
                                key === 'provincia' ||
                                key === 'distrito' ||
                                key === 's3PdfUrl'||
                                key === 'departamento' ||
                                key === 'xmlSunat' ||
                                key === 'cdrSunat' ||
                                key === 'comprobanteId' ||
                                key === 'tipoDoc' ||
                                // No renderizar campos meta o auxiliares
                                key.startsWith('_')
                            ) {
                                return null;
                            }

                            // Determinar si la celda es editable
                            let isEditable: boolean

                            if (isNoteType05) {
                                // Solo descripcion editable en nota tipo 4
                                isEditable = key === 'precioUnitario'
                            } else
                                if (isNoteType04) {
                                    // Solo descripcion editable en nota tipo 4
                                    isEditable = key === 'precioUnitario'
                                } else if (isNoteType03) {
                                    // Solo descripcion editable en nota tipo 3
                                    isEditable = key === 'descripcion'
                                } else if (isNoteType07) {
                                    // tu vieja regla para notas 07
                                    isEditable = key === 'cantidad' && !isCanceled
                                } else {
                                    // tu regla normal (factura/boleta)
                                    isEditable = ['descripcion', 'cantidad', 'precioUnitario', 'descuento']
                                        .includes(key) && !isCanceled
                                }
                            if (isNoteType08) {
                                isEditable = key === 'precioUnitario'
                            }
                            if (isNoteType09) {
                                isEditable = key === 'precioUnitario'
                            }
                            if (isNoteType10) {
                                isEditable = key === 'precioUnitario'
                            }
                            const cellValue =
                                cell === null || cell === undefined ? '' : cell.toString();
                            const isTruncatable = key === 'direccion' || key === 'nombre' || key === 'razonSocial';

                            return (
                                <td
                                    key={cellIndex}
                                    style={{
                                        color: colorFont,
                                        whiteSpace: hasAddressAndName ? 'normal' : undefined,
                                        overflowWrap: hasAddressAndName ? 'break-word' : undefined,
                                    }}
                                >
                                    {isEditable ? (
                                        <input
                                            type={key === 'descripcion' ? 'text' : 'number'}
                                            value={cellValue}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                handleInputChange(
                                                    index,
                                                    key,
                                                    key === 'descripcion' ? e.target.value : e.target.value
                                                )
                                            }
                                            className="w-full py-1 px-3 border text-[#4d4d4d] text-[13px] border-[#dadada] rounded-xl"
                                            disabled={!isEditable}
                                        />
                                    )

                                        : key === 'stock' ? (
                                            cell !== null && cell !== '' ? (
                                                <p
                                                    className={
                                                        Number(cell) <= 5
                                                            ? 'text-red-500 border-[#e9fae4] bg-[#ffe3e1] rounded-lg px-3 w-12 py-1 text-center font-bold'
                                                            : 'text-green-500 border-[#e9fae4] bg-[#e9fae4] rounded-lg px-3 w-12 py-1 text-center font-bold'
                                                    }
                                                >
                                                    {cell as React.ReactNode}
                                                </p>
                                            ) : (
                                                // cuando está vacío no le ponemos clase
                                                <p>{cell}</p>
                                            )
                                        ) : key === 'estado' || key === 'tipo' ? (
                                            <div
                                                className={
                                                    cell === 'EMITIDO'
                                                        ? styles.successOrder
                                                        : cell === 'ACTIVO'
                                                            ? styles.activeOrder
                                                            : cell === 'PENDIENTE'
                                                                ? styles.activeOrder
                                                                : cell === 'RECHAZADO'
                                                                    ? styles.inactiveOrder
                                                                    : cell === 'PENDIENTE_PAGO'
                                                                        ? styles.activeOrder
                                                                        : cell === 'PAGO_PARCIAL'
                                                                            ? styles.activeOrder
                                                                            : cell === 'COMPLETADO'
                                                                                ? styles.activeOrder
                                                                                : cell === 'INGRESO'
                                                                                    ? styles.successOrder
                                                                                    : cell === 'SALIDA'
                                                                                        ? styles.inactiveOrder
                                                                                        : cell === 'AJUSTE'
                                                                                            ? styles.activeOrder
                                                                                            : cell === 'TRANSFERENCIA'
                                                                                                ? styles.successOrder
                                                                                                : styles.inactiveOrder
                                                }
                                            >
                                                {cell === 'PENDIENTE'
                                                    ? 'PENDIENTE'
                                                    : cell === 'INGRESO'
                                                        ? 'INGRESO'
                                                        : cell === 'SALIDA'
                                                            ? 'SALIDA'
                                                            : cell === 'AJUSTE'
                                                                ? 'AJUSTE'
                                                                : cell === 'TRANSFERENCIA'
                                                                    ? 'TRANSFERENCIA'
                                                                    : cell === 'ACTIVO'
                                                                        ? 'ACTIVO'
                                                                        : cell === 'EMITIDO'
                                                                            ? 'EMITIDO'
                                                                            : cell === 'RECHAZADO'
                                                                                ? 'RECHAZADO'
                                                                                : cell === 'ANULADO'
                                                                                    ? 'ANULADO'
                                                                                    : cell === 'PENDIENTE_PAGO'
                                                                                        ? 'PENDIENTE DE PAGO'
                                                                                        : cell === 'PAGO_PARCIAL'
                                                                                            ? 'PENDIENTE PAGO'
                                                                                            : cell === 'COMPLETADO'
                                                                                                ? 'COMPLETADO'
                                                                                                : 'INACTIVO'}
                                            </div>
                                        ) : (
                                            isTruncatable ? (
                                                <span className={styles.truncate} title={cellValue}>
                                                    {cellValue}
                                                </span>
                                            ) : (
                                                cell as React.ReactNode
                                            )
                                        )}
                                </td>
                            );
                        })}
                        {actions && actions.length > 0 && (
                            <td
                                style={{
                                    color: colorFont,
                                    whiteSpace: hasAddressAndName ? 'normal' : undefined,
                                    overflowWrap: hasAddressAndName ? 'break-word' : undefined
                                }}
                                className={styles.tableActions}
                            >
                                {actions.map((action: any, actionIndex: number) => {
                                    if (action.condition && !action.condition(row)) {
                                        return null; // No renderizar la acción si no se cumple la condición
                                    }

                                    const iconElement = typeof action.icon === 'function' ? action.icon(row) : action.icon;
                                    const tooltipText = typeof action.tooltip === 'function' ? action.tooltip(row) : action.tooltip;

                                    return (
                                        <div key={actionIndex} className={styles.tooltipContainer}>
                                            <button
                                                className={styles[`${action.className}`]}
                                                onClick={() => action.onClick(row)}
                                            >
                                                {iconElement}
                                            </button>
                                            <p className={styles.tooltip}>{tooltipText}</p>
                                        </div>
                                    );
                                })}
                            </td>
                        )}
                    </tr>
                );
            })}
        </tbody>
    );
};

export default TableBody;