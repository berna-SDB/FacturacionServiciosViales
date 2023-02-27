/**
 *@NApiVersion 2.1
*@NScriptType UserEventScript
*/
define([
    "N/log",
    'N/record',
    'N/search',
    'N/https',
    'N/record'
],
    function (log, record, search, https, record) {
        function afterSubmit(ctx) {
            var newRecordInvoice = ctx.newRecord;
            if (ctx.type == 'delete') return;

            newRecordInvoice = record.load({
                type: newRecordInvoice.type,
                id: newRecordInvoice.id,
                isDynamic: true,

            });
            try {
                log.debug('newRecordInvoice', newRecordInvoice);
                log.debug('ctx.type', ctx.type);

            } catch (e) {
                log.debug('e', e)
                log.error('execute', '1');
            }

            if (ctx.type === ctx.UserEventType.CREATE || ctx.type === ctx.UserEventType.EDIT) {}
                // Builder objs for json 
            //     var reqCliente;
            //     var reqComprobante = {};
            //     var reqDetalles;
            //     var reqRg_especiales = {};
            //     var reqPagos = {};

            //     // ********* GET VALUES OF CUSTOMER 
            //     try {
            //         let customerId = newRecordInvoice.getValue('entity')

            //         var reqApiAfip = {
            //             "usertoken": "27f8a188d5cc506dea38e909a491e76f098a3301b5c074d88092509a76537b34",
            //             "apikey": "53610",
            //             "apitoken": "ac04bf74c9ef13d717f95873fcbaef0a",
            //             "cliente": {
            //                 "documento_tipo": "CUIT",// F
            //                 "documento_nro": "30655225567",// F 
            //                 "razon_social": "Servicios Viales de Santa Fe S.A.",// T
            //                 "email": "tusfacturas@vousys.com",// T
            //                 "domicilio": "AV.LIBERTADOR 571",// T
            //                 "provincia": "2",// F requiere logica 
            //                 "envia_por_mail": "S",// T
            //                 "condicion_pago": "211",// F consultar con sv
            //                 "condicion_iva": "RI"// T consultar cual es el tipo M 
            //             },
            //             "comprobante": {
            //                 "fecha": "08/11/2018",// T trandate genera
            //                 "tipo": "FACTURA A",// F ?
            //                 "operacion": "V", // F
            //                 "punto_venta": "0001",// F
            //                 "numero": "00000081",// F consultar jesus vigor?
            //                 "periodo_facturado_desde": "08/11/2022",// F consulta a sv, servicios
            //                 "periodo_facturado_hasta": "08/12/2022",// F consulta a sv, servicios
            //                 "rubro": "Alimentos",// T
            //                 "rubro_grupo_contable": "Alimentos",// T
            //                 "detalle": [
            //                     {
            //                         "cantidad": "1",// T
            //                         "producto": {
            //                             "descripcion": "EXENTO - AVENA INSTANTANEA x5 kg. al 21",//T
            //                             "unidad_bulto": "1",//T
            //                             "lista_precios": "Lista de precios API 3",// F
            //                             "codigo": "16098", // F consulta sobre campo 
            //                             "precio_unitario_sin_iva": "100", // T
            //                             "alicuota": "21"// T -> requiere  logica  para exento, no gravado y cero!
            //                         },
            //                         "leyenda": "Enviadas en cajas separadas"
            //                     }
            //                 ],
            //                 "bonificacion": "0.00",//F
            //                 "leyenda_gral": " ",//F
            //                 "percepciones_iibb": "0",// F
            //                 "percepciones_iibb_base": "0",//F
            //                 "percepciones_iibb_alicuota": "0",//f
            //                 "percepciones_iva": "0",//F
            //                 "percepciones_iva_base": "0",//F
            //                 "percepciones_iva_alicuota": "0",//F
            //                 "exentos": "0",//F
            //                 "impuestos_internos": "0",//F
            //                 "impuestos_internos_base": "0",//F
            //                 "impuestos_internos_alicuota": "0",//F
            //                 "total": "121",// T
            //                 "comprobantes_asociados": []// T
            //             }
            //         };
            //         var hedearsRequest = {
            //             "Content-Type": "application/json"
            //         }
            //         //// ------********MAPING***********
            //         // Get filds of customer
            //         var dataCustomer = search.lookupFields({
            //             type: record.Type.CUSTOMER,
            //             id: customerId,
            //             columns: ['custentitycustentity_sdb_razonsocial', 'emailtransactions', 'billaddress', 'email', 'custentitysdb_condicion_de_pago', 'custentity_sdb_condicion_frente_al_iva']
            //         });

            //         // Modifying data to match API
            //         dataCustomer.emailtransactions == 'F' ?
            //             dataCustomer.emailtransactions = 'N'
            //             : dataCustomer.emailtransactions = 'S';

            //         switch (dataCustomer.custentity_sdb_condicion_frente_al_iva[0].text) {
            //             case 'Consumidor Final':
            //                 dataCustomer.custentity_sdb_condicion_frente_al_iva = 'CF';
            //                 break;
            //             case 'Responsable Inscripto':
            //                 dataCustomer.custentity_sdb_condicion_frente_al_iva = 'RI';
            //                 break;
            //             case 'Monotributista':
            //                 dataCustomer.custentity_sdb_condicion_frente_al_iva = 'M';
            //                 break;
            //             case 'Exento':
            //                 dataCustomer.custentity_sdb_condicion_frente_al_iva = 'E';
            //                 break;
            //             case 'Exterior':
            //                 dataCustomer.custentity_sdb_condicion_frente_al_iva = 'CDEX';
            //                 break;
            //             case 'IVA No Alcanzado':
            //                 dataCustomer.custentity_sdb_condicion_frente_al_iva = 'IVNA';
            //                 break;
            //             case 'Responsable Inscripto Tipo M':
            //                 dataCustomer.custentity_sdb_condicion_frente_al_iva = 'IVNA';
            //                 break;
            //         }

            //         reqApiAfip.cliente.email = dataCustomer.email;
            //         reqApiAfip.cliente.domicilio = dataCustomer.billaddress.split("\n")[1];
            //         // reqApiAfip.cliente.custentitysdb_condicion_de_pago = dataCustomer.custentitysdb_condicion_de_pago[0].text;

            //         log.debug('reqApiAfip.razon_social', reqApiAfip.razon_social);
            //         log.debug('reqApiAfip.email', reqApiAfip.email);
            //         log.debug('reqApiAfip.domicilio', reqApiAfip.domicilio);
            //         log.debug('dataCustomer.custentity_sdb_condicion_frente_al_iva', dataCustomer.custentity_sdb_condicion_frente_al_iva);
            //         // log.debug('reqApiAfip.custentitysdb_condicion_de_pago',reqApiAfip.custentitysdb_condicion_de_pago);

            //     } catch (e) {
            //         log.debug('customer try catch ', e)
            //     }
            //     // TODO numeracion

            //     var puntoDeVenta = newRecordInvoice.getText('custbody_sbd_point_sell');
            //     var tipoDeComprobante = newRecordInvoice.getText('custbody_sdb_type_invoice_send');

            //     log.debug('tipoDeComprobante', tipoDeComprobante);
            //     log.debug('puntoDeVenta', puntoDeVenta);
            //     // ********* COMPROBANTE PARTE 1
            //     try {
            //         // requiere logica y creacion de records 

            //         var numeracionComprobante = "00000092";
            //         reqApiAfip.comprobante.numero = numeracionComprobante;

            //         var CurrentDateAfip = new Date();
            //         reqComprobante.fecha = `${CurrentDateAfip.getDate()}/${CurrentDateAfip.getMonth() + 1}/${CurrentDateAfip.getFullYear()}`;
            //         var currency = newRecordInvoice.getValue('currency');

            //         if (currency.text == 'U$C' || currency.text == 'U$D' || currency.text == 'U$S') {
            //             reqComprobante.modena = 'DOL';
            //         } else if (currency.text == 'ARS') {
            //             reqComprobante.modena = 'PES';
            //         } else if (currency.text == 'Euro') {
            //             reqComprobante.modena = '060';
            //         }
            //         reqComprobante.idioma = 1;
            //         reqComprobante.cotizacion = newRecordInvoice.getValue('exchangerate');
            //         reqComprobante.operacion;
            //         reqComprobante.punto_venta;

            //         // Start date and date wating for revision TODO: Revision factura desde - hasta
            //         reqComprobante.periodo_facturado_desde = newRecordInvoice.getValue('startdate');
            //         reqComprobante.periodo_facturado_hasta = newRecordInvoice.getValue('enddate');

            //         reqComprobante.vencimiento = newRecordInvoice.getValue('duedate');
            //         reqComprobante.rubro = newRecordInvoice.getText('class');

            //     } catch (e) {
            //         log.debug('error in the comprobante', e)
            //     }

            //     // ************ GET VALUES OF PRODUCTS 
            //     try {
            //         const length = newRecordInvoice.getLineCount('item');
            //         const items = [];
            //         for (let i = 0; i < length; i++) {
            //             items.push({
            //                 cantidad: newRecordInvoice.getSublistValue({
            //                     sublistId: 'item',
            //                     fieldId: 'quantity',
            //                     line: i
            //                 }),
            //                 unidad_bulto: newRecordInvoice.getSublistValue({
            //                     sublistId: 'item',
            //                     fieldId: 'quantity',
            //                     line: i
            //                 }),
            //                 afecta_stock: newRecordInvoice.getSublistValue({
            //                     sublistId: 'item',
            //                     fieldId: 'itemtype',
            //                     line: i
            //                 }),
            //                 descripcion: newRecordInvoice.getSublistValue({
            //                     sublistId: 'item',
            //                     fieldId: 'description',
            //                     line: i
            //                 }),
            //                 item: newRecordInvoice.getSublistValue({
            //                     sublistId: 'item',
            //                     fieldId: 'item_display',
            //                     line: i
            //                 }),
            //                 costEstimate: newRecordInvoice.getSublistValue({
            //                     sublistId: 'item',
            //                     fieldId: 'costestimatetypelist',
            //                     line: i
            //                 }),
            //                 precio_unitario_sin_iva: newRecordInvoice.getSublistValue({
            //                     sublistId: 'item',
            //                     fieldId: 'amount',
            //                     line: i
            //                 }),
            //                 // -------------------
            //                 taxCode: newRecordInvoice.getSublistValue({
            //                     sublistId: 'item',
            //                     fieldId: 'taxcode',
            //                     line: i
            //                 }),
            //                 taxAmount: newRecordInvoice.getSublistValue({
            //                     sublistId: 'item',
            //                     fieldId: 'taxcode_display',
            //                     line: i
            //                 }),
            //                 alicuota: newRecordInvoice.getSublistValue({
            //                     sublistId: 'item',
            //                     fieldId: 'taxrate1',
            //                     line: i
            //                 }),
            //                 amount: newRecordInvoice.getSublistValue({
            //                     sublistId: 'item',
            //                     fieldId: 'amount',
            //                     line: i
            //                 }),
            //                 discount: newRecordInvoice.getSublistValue({
            //                     sublistId: 'item',
            //                     fieldId: 'discounttotal',
            //                     line: i
            //                 }),
            //             });
            //         }
            //         //Logic for the fild
            //         // ITEMS
            //         reqDetalles = [{}];
            //         for (let i = 0; i < items.length; i++) {
            //             // // Product is service or product material
            //             // if (items[i].afecta_stock == 'InvtPart') {
            //             //     items[i].afecta_stock = 'S'
            //             // } else {
            //             //     items[i].afecta_stock = 'N'
            //             // }
            //             reqDetalles[i].cantidad = items[i].cantidad;
            //             reqDetalles[i].producto = {};
            //             reqDetalles[i].producto.descripcion = items[i].descripcion;
            //             reqDetalles[i].producto.unidad_bulto = items[i].cantidad;
            //             reqDetalles[i].producto.codigo = items[i].item;
            //             reqDetalles[i].producto.precio_unitario_sin_iva = items[i].amount;
            //             reqDetalles[i].producto.alicuota = items[i].alicuota;
            //             reqDetalles[i].leyenda = items[i].descripcion;
            //             log.debug('reqDetalles[1].producto.alicuota', reqDetalles[i].producto.alicuota);
            //             log.debug('items[1].taxCode', items[i].taxCode);
            //         }

            //         reqApiAfip.comprobante.detalle = reqDetalles;


            //         log.debug('items', items);
            //         log.debug('reqDetalles', reqDetalles);

            //     } catch (err) {
            //         log.debug('error of PRODUCTS', err)
            //     }

            //     //************* COMPROBANTE PARTE 2
            //     // Iva y bonificaciones
            //     reqPagos.total = newRecordInvoice.getValue('total');
            //     reqApiAfip.comprobante.total = reqPagos.total;
            //     log.debug('reqApiAfip', reqApiAfip)
            //     try {
            //         var response = https.post({
            //             body: JSON.stringify(reqApiAfip),
            //             url: 'https://www.tusfacturas.app/app/api/v2/facturacion/nuevo',
            //             headers: hedearsRequest
            //         });
            //         var objResponse = JSON.parse(response.body);

            //         log.debug('objResponse.error', objResponse.error)
            //         log.debug('objResponse.error', objResponse)

            //         // Request to get nunmber=> we need for get pdf and 
            //         var jsonRequestNumeration = {
            //             "usertoken": "27f8a188d5cc506dea38e909a491e76f098a3301b5c074d88092509a76537b34",
            //             "apikey": "53610",
            //             "apitoken": "ac04bf74c9ef13d717f95873fcbaef0a",
            //             "comprobante": {
            //                 "tipo": "FACTURA A",
            //                 "operacion": "V",
            //                 "punto_venta": "0001"
            //             }
            //         }
            //         // Condition when response is OKEY
            //         if (objResponse.error == "N") {
            //             var responseNumetarion = https.post({
            //                 body: JSON.stringify(jsonRequestNumeration),
            //                 url: 'https://www.tusfacturas.app/app/api/v2/facturacion/numeracion',
            //                 headers: hedearsRequest
            //             });
            //             var numeroComprobante = JSON.parse(responseNumetarion.body);
            //             log.debug('numeroComprobante.comprobante.numero', numeroComprobante);

            //             var numeroComprobanteNumber = reqApiAfip.comprobante.numero.replaceAll('0', '');
            //             log.debug('numeroComprobanteNumber', numeroComprobanteNumber);

            //             var invLoadObj = record.load({
            //                 type: newRecordInvoice.type,
            //                 id: newRecordInvoice.id, // 
            //                 isDynamic: true,
            //             });

            //             invLoadObj.setValue({
            //                 fieldId: 'custbody_sdb_type_invoice',
            //                 value: objResponse.comprobante_tipo,
            //                 ignoreFieldChange: true
            //             });
            //             invLoadObj.setValue({
            //                 fieldId: 'custbody_sdb_operation_fac',
            //                 value: reqApiAfip.comprobante.operacion,
            //                 ignoreFieldChange: true
            //             });
            //             invLoadObj.setValue({
            //                 fieldId: 'custbody_sbd_point_sell',
            //                 value: reqApiAfip.comprobante.punto_venta,
            //                 ignoreFieldChange: true
            //             });
            //             invLoadObj.setValue({
            //                 fieldId: 'custbody_sdb_number_fac',
            //                 value: numeroComprobanteNumber,
            //                 ignoreFieldChange: true
            //             });
            //             invLoadObj.setValue({
            //                 fieldId: 'custbody_sdb_link_to_pdf',
            //                 value: objResponse.comprobante_pdf_url,
            //                 ignoreFieldChange: true
            //             });
            //             invLoadObj.save({ ignoreFieldChange: true });
            //             log.debug('invLoadObj', invLoadObj.id);

            //             // Anular factura 
            //         }

            //     } catch (e) {
            //         log.debug('e', e)
            //     }

            // }
            newRecordInvoice.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            })
        }
        function beforeLoad(ctx) {
            try {
                if (ctx.type == ctx.UserEventType.VIEW) {
                    log.debug('ctx form', ctx.form)
                    const recordInvoice = ctx.newRecord;
                    var idRcd = recordInvoice.id;

                    rcdType = { key: recordInvoice.type };

                    var urlPdf = recordInvoice.getValue({
                        fieldId: 'custbody_sdb_link_to_pdf'
                    });

                    var noSendAfiP = recordInvoice.getValue({
                        fieldId: 'custbody_sdb_not_send_afip'
                    });

                    let objUrl = { key: urlPdf };

                    // *** provate functionality to form ***
                    var form = ctx.form;
                    form.clientScriptModulePath = './sdb_client_function_buttons.js';

                    // Add buttons
                    log.debug('noSendAfiP',noSendAfiP)
                    
                    if (!noSendAfiP) {
                        form.addButton({
                            id: 'custpage_sdb_autorizar_afip',
                            label: 'Autorizar AFIP',
                            functionName: 'autorizarFactura(' + JSON.stringify(rcdType) + ',' + idRcd + ')'
                        });
                        if (urlPdf) {
                            form.addButton({
                                id: 'custpage_sdb_print_pdf',
                                label: 'Print PDF',
                                functionName: 'print(' + JSON.stringify(objUrl) + ')'
                            });
                            form.addButton({
                                id: 'custpage_sdb_check_status',
                                label: 'Consultar Estado',
                                functionName: 'checkStatus(' + JSON.stringify(rcdType) + ',' + idRcd + ')'
                            });
                        }
                    }
                }

            } catch (e) {
                log.debug("Error on BeforeLoad", e)
            }
        }

        return {
            // beforeSubmit: beforeSubmit,
            beforeLoad: beforeLoad,
            afterSubmit: afterSubmit
        }
    });
