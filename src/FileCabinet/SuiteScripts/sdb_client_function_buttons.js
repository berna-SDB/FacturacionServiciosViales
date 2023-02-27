/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @author Bernabee Gonzalez
 */

define(['N/url',
    'N/https',
    'N/ui/message',
], function (url, https, message) {
    function pageInit(ctx) { }
    function print(urlPdf) {
        try {
            let urlDecode = urlPdf
            // window.open(urlPdf');
            window.open(urlDecode.key);
        } catch (e) {
            console.log(`error | ${e} - ${e.message}`);
            console.log(e)
        }
    }
    function checkStatus(recordType, recordId) {
        var rcdType = recordType
        let suiteletURL = url.resolveScript({
            scriptId: 'customscript_sdb_check_status_fac',
            deploymentId: 'customdeploy_sdb_deploy_check_status',
            returnExternalURL: true,
            params: {
                recordType: rcdType.key,
                recordId: recordId
            }
        });
        https.get.promise({
            url: suiteletURL,
        }).then(function (response) {
            var res = JSON.parse(response.body);
            if (res.status === "success") {
                var myMsg = message.create({
                    title: "status updated",
                    message: res.message,
                    type: message.Type.CONFIRMATION
                })
                myMsg.show();
                setTimeout(function () { window.location.reload() }, 5000)
            } else {
                var myMsg = message.create({
                    title: "Could not update status",
                    message: res.message,
                    type: message.Type.WARNING
                })
                myMsg.show();
            }
        }).catch(function (reason) {
            var myMsg = message.create({
                title: "Could not update  status",
                message: reason,
                type: message.Type.WARNING
            })
            myMsg.show();
        });
    }
    // Autorizar factura
    function autorizarFactura(objRcdType, recordId) {
        try {
            var rcdType = objRcdType
            let suiteletURL = url.resolveScript({
                scriptId: 'customscript_sdb_autorizar_factura_afip',
                deploymentId: 'customdeploy_sdb_deploy_autorizar_afip',
                returnExternalURL: true,
                params: {
                    recordType: rcdType.key,
                    recordId: recordId
                }
            });
            
            https.get.promise({
                url: suiteletURL,
            }).then(function (response) {
                var res = JSON.parse(response.body);
                console.log(res)
                if (res.status === "success") {
                    var myMsg = message.create({
                        title: "Autorizado",
                        message: res.message,
                        type: message.Type.CONFIRMATION
                    })
                    myMsg.show();
                    setTimeout(function () { window.location.reload() }, 5000);
                } else if (res.status === "Not success") {
                    var myMsg = message.create({
                        title: "No Autorizado, se encontro un error en los datos del comprobante",
                        message: res.message,
                        type: message.Type.WARNING
                    })
                    myMsg.show();
                    setTimeout(function () { window.location.reload() }, 10000);
                } else {
                    var myMsg = message.create({
                        title: "Error al enviar la factura",
                        message: res.message,
                        type: message.Type.WARNING
                    })
                    myMsg.show();
                    setTimeout(function () { window.location.reload() }, 10000);
                }
            }).catch(function (reason) {
                var myMsg = message.create({
                    title: "No Autorizado",
                    message: reason,
                    type: message.Type.WARNING
                })
                myMsg.show();
                setTimeout(function () { window.location.reload() }, 10000);
            });
        } catch (err) {
            console.log(err)
        }
    }


    return {
        pageInit,
        checkStatus,
        print,
        autorizarFactura
    };
});