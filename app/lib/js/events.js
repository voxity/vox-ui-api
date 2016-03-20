function updateStateRegistration(deviceObject){
    
    if (STATES_TRANSLATE !== undefined) {
        var stateDesc = STATES_TRANSLATE['fr']['unknow'];
        if (STATES_TRANSLATE['fr'][deviceObject.state_desc]) {
            stateDesc = STATES_TRANSLATE['fr'][deviceObject.state_desc];
        }
    } else {
        var stateDesc = deviceObject.state_desc;
    }
    
    if (updateState !== undefined) {
        if ($('#' + deviceObject.id).length == 1 && (self.state == 0 || self.state == 5)) {
            var iconState = $('#' + deviceObject.id + " .icon-blf-state>i");
            if (DEVICE_CLASS[deviceObject.state]) {
                iconState.attr('class', DEVICE_CLASS[deviceObject.state]);
            } else {
                iconState.attr('class', DEVICE_CLASS.default);
            }
            
            iconState.attr('title', stateDesc);
            iconState.attr('data-original-title', stateDesc);
            iconState.tooltip({container: 'body'})

        } else if($('#' + deviceObject.id).length > 1) {
            console.error('Can update device, multiple id for : ' + deviceObject.id)
        } else if ($('#' + deviceObject.id).length < 1) {
            if (refreshState !== undefined) {
                refreshState();
            }
        }
    }
    if (deviceObject.state == 5 && deviceObject.extension == myExtension) {
        var mess = "Votre poste est déconnecté de la platforme Voxity";
        var title = "Poste déconnecté!"
        toastr["error"](mess, title);
        notify.showMessage(deviceObject['id'], title, mess, 'SUPPOERT_LEVEL1_LINK_commingSoon')
    }
}

$(document).ready(function() {
    var socket = io.connect('https://api.voxity.fr/', {
        path:'/event/v1',
        query:"access_token=" + token
    });

    socket.on('connected', function(data){
        
        socket.on('channels.ringing', function(callObj){
            if (callObj['caller_num'] != myExtension) {        
                whois(callObj['caller_num'], function(err, contacts){
                    var name = callObj['caller_name'] 
                    if (!err && contacts[0]) {
                        name = contacts[0]['cn']
                    }
                    var mess = "de <strong>" + name + "</strong> <"+callObj['caller_num']+">";
                    mess += '<br>';
                    mess += getUriIfo(callObj['caller_num'])
                    toastr["info"](mess, "Appel entrant");
                    notify.showMessage(callObj['id'], 'Appel entrant','de ' + name + ' <'+callObj['caller_num']+'>', getUriIfo(callObj['caller_num']))
                });
            }
        })

        socket.on('channels.up', function(callObj){
            whois(callObj['caller_num'], function(err, callerNameList){
                var name = callObj['caller_name'] 
                if (!err && contacts[0]) {
                    name = contacts[0]['cn']
                }
                var mess = "<strong>" + name + "</strong> <"+callObj['caller_num']+">";
                mess += '<br>';
                mess += getUriIfo(callObj['caller_num'])
                if (callObj['caller_num'] != myExtension) {        
                    toastr["success"](mess, "Vous etes en communication avec " + callObj['caller_num'])
                }
            });
        })

        socket.on('channels.hangup', function(data){
            if (notify.list[data['id']] && !notify.list[data['id']]['notSend']) {
                var mess = notify.list[data['id']].message;
                mess += ' est raccroché';    
            } else {
                var mess = "Fin d'appel avec " + callObj['caller_num']
            }
            
            if (data['caller_num'] != myExtension) {        
                toastr["error"](mess, "Fin d'appel");
            }
            notify.list[data['id']].close();
        })

        socket.on("devices.status.available", updateStateRegistration);
        socket.on("devices.status.unavailable", updateStateRegistration);
    })

    // to show all event
    // socket.onevent = function (packet) {
    //     console.log(packet)
    // }
});