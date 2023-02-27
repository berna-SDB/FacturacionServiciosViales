/**
 *@NApiVersion 2.1
 */
 define([],
    function () {
        return {
            documento_tipo:'CUIT',
            documento_nro:'vatregnumber',
            razon_social: 'custentitycustentity_sdb_razonsocial',
            email: 'email',
            domicilio: 'billaddress',
            provincia: 'billaddress',
            envia_por_mail:'emailtransactions',
            condicion_pago:'custentitysdb_condicion_de_pago',
            condicion_pago_terminos:'terms',
            condicion_iva: 'custentity_sdb_condicion_frente_al_iva', 
            cotiza_en_bolsa: 'custentity_sdb_cotiza_en_bolsa',
            //////// Comprobante Cuerpo
            fecha: 'trandate',
            tipo: 'custbody_sdb_type_invoice_send',
            operacion: 'custbody_sdb_operation_fac',
            punto_venta:'custbody_sbd_point_sell',
            numero:'custbody_sdb_number_fac',
            comprobante_asociado: 'createdfrom',
            periodo_facturado_desde:'startdate',
            periodo_facturado_hasta:'enddate',
            rubro:'class',
            rubro_grupo_contable: 'class',
            idioma:'1',
            cotizacion:'exchangerate',
            vencimiento: 'duedate',
            total: 'total'
            // Esta en el codigo
        };
    });
