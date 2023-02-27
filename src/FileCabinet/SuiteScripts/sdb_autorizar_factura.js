/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define([
    "N/render",
    "N/record",
    "N/log",
    "N/https",
    "N/search",
    "./SDB_mapper_facturacion_electronica.js",
    "N/format"
], function (render, record, log, https, search, mapper, format) {

    function onRequest(context) {
        // Suitlet Parameters
        log.debug("mapper", mapper.testing)
        var request = context.request;
        var parameters = context.request.parameters;
        
        var recordId = request.parameters.recordId;
        var recordType = request.parameters.recordType;

        const currentRecord = record.load({
            type: recordType,
            id: Number(recordId),
            isDynamic: true,
        });

        let typeNotaDebitInvoice = currentRecord.getValue('custbody_sdb_nota_de_debito');
        let typeInvoice = currentRecord.getText(mapper.tipo);
        let pointSell = currentRecord.getText(mapper.punto_venta);
        const numeracionComprobante = numeracionDelComprobante();
        log.debug('numeracionComprobante', numeracionComprobante);
        log.debug('pointSell', pointSell);
        log.debug('typeInvoice', typeInvoice);

        // Trear numeracion
        function numeracionDelComprobante() {
            var last_number;
            var idRecordNumeration;

            var customrecord_sdb_facturacion_numeracionSearchObj = search.create({
                type: "customrecord_sdb_facturacion_numeracion",
                filters:
                    [
                        ["custrecord_sdb_tipo_factura", "is", typeInvoice],
                        "AND",
                        ["custrecord_sdb_ubicacion_punto_venta", "is", pointSell]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "Internal ID" }),
                        search.createColumn({ name: "custrecord_sdb_ubicacion_punto_venta", label: "Punto De Venta" }),
                        search.createColumn({ name: "custrecord_sdb_numeracion_factura", label: "Ultimo Numero de la Factura" }),
                        search.createColumn({ name: "custrecord_sdb_tipo_factura", label: "Tipo de Factura" })
                    ]
            });
            var searchResultCount = customrecord_sdb_facturacion_numeracionSearchObj.runPaged().count;

            customrecord_sdb_facturacion_numeracionSearchObj.run().each(function (result) {
                last_number = result.getValue({ name: "custrecord_sdb_numeracion_factura" });
                idRecordNumeration = result.getValue({ name: "internalid" });
                return true;
            });

            try {
                var updateNumber = setTimbradoFormat(parseInt(last_number) + 1);
                log.debug('updateNumber', updateNumber);

                // Get  custom record numeration
                var record_numeration = record.load({
                    type: "customrecord_sdb_facturacion_numeracion",
                    id: idRecordNumeration,
                    isDynamic: true,
                });

            } catch (err) {
                log.debug('err', err)
            }

            // Seting value if there are results in the search if not I create
            if (searchResultCount > 0) {
                log.debug(' more result updateNumber', updateNumber);
                record_numeration.setValue({
                    fieldId: 'custrecord_sdb_numeracion_factura',
                    value: updateNumber,
                    ignoreFieldChange: true
                });
                record_numeration.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
            } else {
                var objRecord = record.create({
                    type: 'customrecord_sdb_facturacion_numeracion',
                    isDynamic: true,
                });
                let updateNumberInitialRecord = setTimbradoFormat(1);
                log.debug('updateNumberInitialRecord', updateNumberInitialRecord);
                objRecord.setValue({
                    fieldId: 'custrecord_sdb_numeracion_factura',
                    value: updateNumberInitialRecord,
                    ignoreFieldChange: true
                });
                objRecord.setValue({
                    fieldId: 'custrecord_sdb_tipo_factura',
                    value: typeInvoice,
                    ignoreFieldChange: true
                });
                objRecord.setValue({
                    fieldId: 'custrecord_sdb_ubicacion_punto_venta',
                    value: pointSell,
                    ignoreFieldChange: true
                });

                objRecord.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });

            }
            return updateNumber;

            function setTimbradoFormat(number_string) {
                const TIMBRADO_LENGTH = 8;
                let length = number_string.toString().length;
                let zeros = TIMBRADO_LENGTH - length;
                let setzeros = '';

                for (let i = 0; i < zeros; i++) {
                    setzeros += '0';
                }
                log.debug('number_string', number_string)
                log.debug('setzeros', setzeros)
                return setzeros + number_string;
            }
        }

        let customerId = currentRecord.getValue('entity');
        var reqComprobante = {};
        var reqDetalles;
        var reqRg_especiales = {};
        var reqPagos = {};

        // ******** Get filds of customer **********
        var dataCustomer = search.lookupFields({
            type: record.Type.CUSTOMER,
            id: customerId,
            columns: [mapper.documento_nro, mapper.razon_social, mapper.email, mapper.domicilio, mapper.provincia, mapper.envia_por_mail, mapper.condicion_pago, mapper.condicion_pago_terminos, mapper.condicion_iva, mapper.cotiza_en_bolsa]
        });

        // Constructores del body de la factura
        function comprobante_cliente(mapperData) {
            try {
                let cliente = {};
                cliente.documento_tipo = mapper.documento_tipo;
                mapperData.vatregnumber.replaceAll('-', '') ? cliente.documento_nro = mapperData.vatregnumber.replaceAll('-', '') : '';
                cliente.razon_social = mapperData.custentitycustentity_sdb_razonsocial;
                cliente.email = mapperData.email;
                mapperData.billaddress.split('\n')[1] ? cliente.domicilio = mapperData.billaddress.split('\n')[1] : cliente.domicilio = '';
                tabla_referencia_provincia(mapperData.billaddress.split('\n')[3]) ? cliente.provincia = tabla_referencia_provincia(mapperData.billaddress.split('\n')[3]) : '';
                mapperData.emailtransactions == 'F' ? cliente.envia_por_mail = 'N' : cliente.envia_por_mail = 'S';
                mapperData.terms[0].text ? cliente.condicion_pago = tabla_referencia_terminos_pagos(mapperData.terms[0].text) : cliente.condicion_pago = "";
                cliente.condicion_iva = tabla_referencia_condicion_iva(mapperData.custentity_sdb_condicion_frente_al_iva[0].text)
                // Modifying data to match API
                log.debug('cliente', cliente);
                return cliente;
            } catch (err) {
                context.response.write(JSON.stringify({
                    status: 'Not success',
                    message: 'Error en datos del cliente: ' + err,
                }));
            }

            function tabla_referencia_condicion_iva(condicionIVA) {
                var condicion_iva;
                switch (condicionIVA) {
                    case 'Consumidor Final':
                        condicion_iva = 'CF';
                        break;
                    case 'Responsable Inscripto':
                        condicion_iva = 'RI';
                        break;
                    case 'Monotributista':
                        condicion_iva = 'M';
                        break;
                    case 'Exento':
                        condicion_iva = 'E';
                        break;
                    case 'Exterior':
                        condicion_iva = 'CDEX';
                        break;
                    case 'IVA No Alcanzado':
                        condicion_iva = 'IVNA';
                        break;
                    case 'Responsable Inscripto Tipo M':
                        condicion_iva = 'IVNA';
                        break;
                }
                return condicion_iva
            }
            function tabla_referencia_provincia(provincia) {
                var location
                try {
                    if (provincia) {
                        location = provincia.toUpperCase().trim();
                    } else {
                        location = '';
                    }
                } catch (err) {
                    log.debug('err', err);
                }
                switch (location) {
                    case "BUENOS AIRES":
                        return 2;
                        break;
                    case "CATAMARCA":
                        return 3;
                        break;
                    case "CHACO":
                        return 4;
                        break;
                    case "CHUBUT":
                        return 5;
                        break;
                    case "CIUDAD AUTONOMA DE BUENOS AIRES":
                        return 1;
                        break;
                    case "CORDOBA":
                        return 6;
                        break;
                    case "CORRIENTES":
                        return 7;
                        break;
                    case "ENTRE RIOS":
                        return 8;
                        break;
                    case "FORMOSA":
                        return 9;
                        break;
                    case "JUJUY":
                        return 10;
                        break;
                    case "LA PAMPA":
                        return 11;
                        break;
                    case "LA RIOJA":
                        return 12;
                        break;
                    case "MENDOZA":
                        return 13;
                        break;
                    case "MISIONES":
                        return 14;
                        break;
                    case "NEUQUEN":
                        return 15;
                        break;
                    case "OTRO":
                        return 25;
                        break;
                    case "RIO NEGRO":
                        return 16;
                        break;
                    case "SALTA":
                        return 17;
                        break;
                    case "SAN JUAN":
                        return 18;
                        break;
                    case "SAN LUIS":
                        return 19;
                        break;
                    case "SANTA CRUZ":
                        return 20;
                        break;
                    case "SANTA FE":
                        return 21;
                        break;
                    case "SANTIAGO DEL ESTERO":
                        return 22;
                        break;
                    case "TIERRA DEL FUEGO":
                        return 23;
                        break;
                    case "TUCUMAN":
                        return 24;
                        break;

                    default:
                        return 26;

                }
            }
            function tabla_referencia_terminos_pagos(terminosPago) {
                let terminos_pago;
                if (terminosPago == "Anticipado") {
                    return terminos_pago = '205';
                } else if (terminosPago.indexOf('diferido') != -1) {
                    return terminos_pago = '214';
                } else if (terminosPago.indexOf('15') != -1) {
                    return terminos_pago = '207';
                } else if (terminosPago.indexOf('30') != -1) {
                    return terminos_pago = '202';
                } else if (terminosPago.indexOf('45') != -1) {
                    return terminos_pago = '208';
                } else if (terminosPago.indexOf('60') != -1) {
                    return terminos_pago = '203';
                } else if (terminosPago.indexOf('90') != -1) {
                    return terminos_pago = '204';
                } else {
                    return terminos_pago = '214';
                }
            }
        }

        function comprobante_cuerpo(currenctRcd) {
            try {
                let cuerpo = {};
                cuerpo.fecha = currenctRcd.getValue(mapper.fecha);
                cuerpo.tipo = currenctRcd.getText('custbody_sdb_type_invoice_send');
                cuerpo.operacion = currenctRcd.getText(mapper.operacion);
                cuerpo.punto_venta = currenctRcd.getValue(mapper.punto_venta);
                cuerpo.numero = numeracionComprobante;
                cuerpo.periodo_facturado_desde = currenctRcd.getValue(mapper.periodo_facturado_desde);
                cuerpo.periodo_facturado_hasta = currenctRcd.getValue(mapper.periodo_facturado_hasta);
                cuerpo.cotizacion = currenctRcd.getValue(mapper.cotizacion);
                cuerpo.vencimiento = currenctRcd.getValue(mapper.vencimiento);
                cuerpo.vencimiento =  formatDate(cuerpo.vencimiento);
                cuerpo.rubro_grupo_contable = currenctRcd.getText(mapper.rubro_grupo_contable);
                cuerpo.rubro = currenctRcd.getText(mapper.rubro);
                cuerpo.detalle = [];
                cuerpo.idioma = currenctRcd.getValue(mapper.idioma);
                cuerpo.fecha = formatDate(cuerpo.fecha);
                log.debug('currenctRcd.type', currenctRcd.type)

                try {
                    if (currenctRcd.type == "invoice") {
                        cuerpo.periodo_facturado_desde = formatDate(cuerpo.periodo_facturado_desde);
                        cuerpo.periodo_facturado_hasta = formatDate(cuerpo.periodo_facturado_hasta);
                        cuerpo.vencimiento = formatDate(cuerpo.vencimiento);
                    }
                } catch (error) {
                    log.debug('error en los format date', error);
                }
                // TODO
                cuerpo.bonificacion = "0.00";
                cuerpo.leyenda_gral = " ";
                cuerpo.percepciones_iibb = "0";
                cuerpo.percepciones_iibb_base = "0";
                cuerpo.percepciones_iibb_alicuota = "0";
                cuerpo.percepciones_iva = "0";
                cuerpo.percepciones_iva_base = "0";
                cuerpo.percepciones_iva_alicuota = "0";
                cuerpo.exentos = "0";
                cuerpo.impuestos_internos = "0";
                cuerpo.impuestos_internos_base = "0";
                cuerpo.impuestos_internos_alicuota = "0";
                cuerpo.total = currenctRcd.getValue(mapper.total);
                if (currenctRcd.getValue(mapper.comprobante_asociado)) {
                    cuerpo.comprobantes_asociados = currenctRcd.getValue(mapper.comprobante_asociado);
                }
                if (typeInvoice.includes('MiPyME')) {
                    cuerpo.rg_especiales = get_Rg_especialesMiPyme();
                }
                return cuerpo;
            } catch (err) {
                log.debug('err', err)
                context.response.write(JSON.stringify({
                    status: 'Not success',
                    message: 'Faltan datos en el comprobante'
                }));
            }
        }

        function comprobante_detalle() {
            try {
                const length = currentRecord.getLineCount('item');
                const detalle = [];
                var reqDetalles = [{}];
                for (let i = 0; i < length; i++) {
                    detalle.push({
                        cantidad: currentRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: i
                        }),
                        unidad_bulto: currentRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: i
                        }),
                        afecta_stock: currentRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'itemtype',
                            line: i
                        }),
                        descripcion: currentRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'description',
                            line: i
                        }),
                        item: currentRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        }),
                        costEstimate: currentRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'costestimatetypelist',
                            line: i
                        }),
                        precio_unitario_sin_iva: currentRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount',
                            line: i
                        }),
                        lista_precios: currentRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'price_display',
                            line: i
                        }),
                        // -------------------
                        taxCode: currentRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'taxcode',
                            line: i
                        }),
                        taxAmount: currentRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'taxcode_display',
                            line: i
                        }),
                        leyenda: currentRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_packship_so_line_packinstruct',
                            line: i
                        }),
                        alicuota: currentRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'taxrate1',
                            line: i
                        }),
                        amount: currentRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            line: i
                        }),
                        discount: currentRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'discounttotal',
                            line: i
                        }),
                    });

                    reqDetalles[i] = {};
                    if (detalle[i].afecta_stock == 'InvtPart') {
                        reqDetalles[i].afecta_stock = 'S';
                    } else {
                        reqDetalles[i].afecta_stock = 'N';
                    }
                    reqDetalles[i].cantidad = detalle[i].cantidad;
                    reqDetalles[i].producto = {};
                    reqDetalles[i].producto.descripcion = detalle[i].descripcion;
                    reqDetalles[i].producto.unidad_bulto = detalle[i].cantidad;
                    reqDetalles[i].producto.codigo = detalle[i].item;
                    reqDetalles[i].producto.lista_precios = detalle[i].lista_precios;
                    reqDetalles[i].producto.precio_unitario_sin_iva = detalle[i].amount;
                    reqDetalles[i].producto.alicuota = detalle[i].alicuota;
                    reqDetalles[i].leyenda = detalle[i].leyenda;

                    
                }
                log.debug('detalle',detalle);
                return reqDetalles
            } catch (err) {
                log.debug('error en el comprobante', err);
                context.response.write(JSON.stringify({
                    status: 'Error en la request',
                    message: 'Faltan datos en los items!' + err
                }));
            }
        }
        function credencialesRequest(USER_Token, API_Key, API_Token) {
            return {
                "usertoken": USER_Token,
                "apikey": API_Key,
                "apitoken": API_Token,
            }
        }

        function get_comprobantes_asociados() {
            try {
                let cuerpoComprobante = comprobante_cuerpo(currentRecord);
                log.debug('comrprobante asociado')
                let datosInvoice = [{}];
                if (typeNotaDebitInvoice) {
                    var idNotaDebito = currentRecord.getValue('custbody_sdb_invoice_related');
                    log.debug('idNotaDebito', idNotaDebito);
                    var recordAsociado = search.lookupFields({
                        type: search.Type.TRANSACTION,
                        id: idNotaDebito,
                        columns: ['trandate', 'custbody_sbd_point_sell', 'custbody_sdb_number_fac', 'custbody_sdb_type_invoice_send', 'customer.vatregnumber']
                    });
                } else {
                    var recordAsociado = search.lookupFields({
                        type: search.Type.TRANSACTION,
                        id: cuerpoComprobante.comprobantes_asociados,
                        columns: ['trandate', 'custbody_sbd_point_sell', 'custbody_sdb_number_fac', 'custbody_sdb_type_invoice_send', 'customer.vatregnumber']
                    });
                }
                datosInvoice[0].tipo_comprobante = recordAsociado.custbody_sdb_type_invoice_send[0].text;
                datosInvoice[0].punto_venta = recordAsociado.custbody_sbd_point_sell;
                datosInvoice[0].numero = recordAsociado.custbody_sdb_number_fac;
                datosInvoice[0].comprobante_fecha = formatDate(recordAsociado.trandate);
                datosInvoice[0].cuit = recordAsociado['customer.vatregnumber'].replaceAll('-', '');
                log.debug('datosInvoice', datosInvoice);
                return datosInvoice;
            } catch (err) {
                log.debug('error en traer comprobantes asociados', err)
                context.response.write(JSON.stringify({
                    status: 'Not success',
                    message: 'Error en comprobante asociados'
                }));
            }
        }

        function get_Rg_especialesMiPyme() {
            let CBU = '0170477220000000114448' ;
            let ALIAS = 'SERVICIOSVIALESSFE';

            log.debug('dataCustomer', dataCustomer.custentity_sdb_cotiza_en_bolsa);

            let reRg_especiales = {
                "regimen": typeInvoice,
                "datos": []
            }
            if (currentRecord.type == 'creditmemo' || currentRecord.type == 'invoice' && typeNotaDebitInvoice) {
                reRg_especiales.datos.push({
                    "id": 22,
                    "valor": "N"
                });
            } else if (currentRecord.type == 'invoice' && !typeNotaDebitInvoice) {
                reRg_especiales.datos.push({
                    "id": 2101,
                    "valor": CBU
                });
                if (dataCustomer.custentity_sdb_cotiza_en_bolsa == false) {
                    reRg_especiales.datos.push({
                        "id": 27,
                        "valor": "SCA"
                    })
                } else {
                    reRg_especiales.datos.push({
                        "id": 27,
                        "valor": "ADC"
                    })
                }
                return reRg_especiales
            }
        }
        function fexComprobanteTipoE() {
            let fex = {
                "tipo_exportacion": "1",
                "pais_comprobante_id": "123",
            }
            log.debug(' Tipoooooooooos typeInvoice',typeInvoice);
            if (typeInvoice == 'NOTA DE DEBITO E' || typeInvoice == 'NOTA DE CREDITO E') {
                fex.comprobantes_asociados = get_comprobantes_asociados();
            }
            return fex;
        }
        var fexComprobante = fexComprobanteTipoE();
        log.debug('fexComprobante' , fexComprobante);
        //Helpers funtion
        function formatDate(strDate) {
            var formattedDateString = format.format({
                value: strDate,
                type: format.Type.DATE
            });
            return formattedDateString;
        }

        // ******  Funciones que los distintos tipos de comprobantes!!!
        // Facturas A
        function ComprobanteFactura() {
            let cuerpoComprobante = {
                ...credencialesRequest("27f8a188d5cc506dea38e909a491e76f098a3301b5c074d88092509a76537b34", "53610", "ac04bf74c9ef13d717f95873fcbaef0a"),
                cliente: comprobante_cliente(dataCustomer),
                comprobante: {
                    ...comprobante_cuerpo(currentRecord),
                    detalle: comprobante_detalle()
                }
            }
            if (typeInvoice == 'FACTURA E') {
                cuerpoComprobante.comprobante.fex = fexComprobanteTipoE()
            }    
            delete cuerpoComprobante.comprobante.comprobantes_asociados;
            delete cuerpoComprobante.comprobante.cotizacion;
            for (const item of cuerpoComprobante.comprobante.detalle) {
                delete item.afecta_stock;
            }
            return cuerpoComprobante;
        }
        //TODO Faltan Campos date and start date end date and moreFACTURA DE CREDITO ELECTRONICA MiPyME (FCE) B
        function ComprobanteNota_credito_tipo_A_B() {
            let cuerpoComprobante = {
                ...credencialesRequest("27f8a188d5cc506dea38e909a491e76f098a3301b5c074d88092509a76537b34", "53610", "ac04bf74c9ef13d717f95873fcbaef0a"),
                cliente: comprobante_cliente(dataCustomer),
                comprobante: {
                    ...comprobante_cuerpo(currentRecord),
                    detalle: comprobante_detalle(),   
                }
            }
            if (typeInvoice == 'NOTA DE CREDITO E') {
                cuerpoComprobante.comprobante.fex = fexComprobanteTipoE();
            } else {
                cuerpoComprobante.comprobante.comprobantes_asociados = get_comprobantes_asociados();
            }

            for (const item of cuerpoComprobante.comprobante.detalle) {
                delete item.afecta_stock;
            }
            delete cuerpoComprobante.comprobante.cotizacion;
            delete cuerpoComprobante.comprobante.vencimiento;
            return cuerpoComprobante;
        }

        function ComprobanteNota_debito() {
            let cuerpoComprobante = {
                ...credencialesRequest("27f8a188d5cc506dea38e909a491e76f098a3301b5c074d88092509a76537b34", "53610", "ac04bf74c9ef13d717f95873fcbaef0a"),
                cliente: comprobante_cliente(dataCustomer),
                comprobante: {
                    ...comprobante_cuerpo(currentRecord),
                    detalle: comprobante_detalle()
                }
            }

            if (typeInvoice == 'NOTA DE CREDITO E') {
                cuerpoComprobante.comprobante.fex = fexComprobanteTipoE();
            } else {
                cuerpoComprobante.comprobante.comprobantes_asociados = get_comprobantes_asociados();
            }
            
            for (const item of cuerpoComprobante.comprobante.detalle) {
                delete item.afecta_stock;
            }
            // delete cuerpoComprobante.comprobante.detalle.afecta_stock;
            delete cuerpoComprobante.comprobante.vencimiento;
            delete cuerpoComprobante.comprobante.cotizacion;
            return cuerpoComprobante;
        }

        // REQUEST
        var request_testing;
        if (currentRecord.type == 'creditmemo') {
            request_testing = ComprobanteNota_credito_tipo_A_B();
        } else if (currentRecord.type == 'invoice' && typeNotaDebitInvoice) {
            request_testing = ComprobanteNota_debito();
        } else if (currentRecord.type == 'invoice' && !typeNotaDebitInvoice) {
            request_testing = ComprobanteFactura();
        }
        //******** HACIENDO PETICIONES 
        var hedearsRequest = {
            "Content-Type": "application/json"
        }
        // var response = https.post({
        //     body: JSON.stringify(request_testing),
        //     url: 'https://www.tusfacturas.app/app/api/v2/facturacion/nuevo',
        //     headers: hedearsRequest
        // });
        // var objResponse = JSON.parse(response.body);
        ///////////////////
        log.debug('request_testing', JSON.stringify(request_testing));
        var objResponse = https.post.promise({
            url: 'https://www.tusfacturas.app/app/api/v2/facturacion/nuevo',
            body: JSON.stringify(request_testing),
            headers: hedearsRequest
        })
            .then(function (response) {
                log.debug('Response', response.code);
                if (response.code == 200) {
                    // Manejo de la Peticion
                    let responseRequest = JSON.parse(response.body)
                    log.debug('responseRequest', responseRequest);
                    if (responseRequest.error == 'N') {
                        currentRecord.setValue({
                            fieldId: 'custbody_sdb_status_fac',
                            value: "Autorizada",
                            ignoreFieldChange: true
                        });
                        currentRecord.setValue({
                            fieldId: 'custbody_sdb_link_to_pdf',
                            value: responseRequest.comprobante_pdf_url,
                            ignoreFieldChange: true
                        });
                        currentRecord.setValue({
                            fieldId: 'custbody_sdb_number_fac',
                            value: request_testing.comprobante.numero,
                            ignoreFieldChange: true
                        });
                        currentRecord.setValue({
                            fieldId: 'custbody_response_afip_invoices',
                            value: responseRequest.errores.toString(),
                            ignoreFieldChange: true
                        });
                        currentRecord.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        });
                        context.response.write(JSON.stringify({
                            status: 'success',
                            message: 'The  status was successfully updated'
                        }));
                    } else {
                        currentRecord.setValue({
                            fieldId: 'custbody_response_afip_invoices',
                            value: responseRequest.errores.toString(),
                            ignoreFieldChange: true
                        });
                        currentRecord.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        });
                        context.response.write(JSON.stringify({
                            status: 'Not success',
                            message: responseRequest.errores.toString()
                        }));
                    }
                }
            })
            .catch(function onRejected(reason) {
                log.debug('error en la petecion', reason)
                context.response.write(JSON.stringify({
                    status: 'Error en la request',
                    message: reason
                }));
            })


        log.debug('objResponse', objResponse);


    }
    return {
        onRequest
    }
});