var windowsIsActive = true

window.onfocus = function () { 
  windowsIsActive = true; 
}; 

window.onblur = function () { 
  windowsIsActive = false; 
}; 

function filter_exten(exten){
    return exten.replace(/(\ |\-|\.|\_|\s)/g, '')
}

function generate_call(exten){
    exten = filter_exten(exten)

    var regTel = /^\+?(\d|[\(\)]){3,}$/;

    if(regTel.test(exten))
    {
        $.ajax({
            url: "/calls/generate",
            method: "POST",
            data: {'exten': exten},
            beforeSend : function(){
                toastr["info"]("Votre Téléphone va sonner.", "Click2 to call", {timeOut: 3500})

            },
            success: function(data, status) {
                if (data.data.status === 1) {
                    toastr["success"]("Appel en cours ver le " + exten, "Click to call");
                    $('#callModal').modal('hide');

                } else if(data.data.status === 500){
                    toastr["error"]("Vous avez rejetté l'appel " + exten, "Click to call");
                }
            },
            error: function(xhr, state, data){
                if (xhr.status != 400) {
                    toastr["warning"]("Error inconnue durant le click2call (err : "+xhr.status+')', "Click to call")
                } else {
                    toastr["warning"]("Click to call error : "+xhr.responseJSON.data.message+')', "Click to call")
                }
            }
        });
    } else {
        toastr["error"]("Le numéro de télephone [" + exten +"] est mal formaté", "Click to call")
    }
}

function whois(number, done){
    if (number) {
        $.ajax({
            url: "/contacts/whois.json",
            method: "GET",
            data: {'number': number},
            success: function(d, status) {
                if (d.data && d.data.length) {
                    done(null ,d.data)
                } else {
                    done('No data in response' ,d.data)
                }
            },
            error: function(xhr, state, d){
                done('No data in response' ,d)
            }
        });
    } else {
        done('Number is empty')
    }
    
}

function getUriIfo(num){

    var dom = '<a href="https://www.google.fr/#q='+num+'" target="_blank" class="btn btn-link">';
    dom += '<i class="fa fa-share-square-o fa-fw"></i> Google search : '+num;
    dom += '</a>';
    return dom
}

var notify = {
    list: {},
    support:function(){
        return ("Notification" in window)
    },
    permited:function(){
        return Notification.permission === "granted"
    },
    showSettings: function(){
        Notification.requestPermission(function (permission) {
            if(!('permission' in Notification)) {
                Notification.permission = permission;
            }
        });
    },
    showMessage: function(id, title, message, uri){
        if (this.support() && this.permited()){
            this.list[id] = new Notification(title, {
                tag: id,
                icon: document.location.origin + $($('.header .img-logo')[0]).attr('src'),
                body: message,
                onclick: function(evt){evt.preventDefault(); window.open(uri, '_blank')}
            });
            this.list[id].message = message;
        }
    }
}

$(document).ready(function() {
    if (notify.support() && Notification.permission.toLowerCase() == "default") {
        notify.showSettings();
    }
    $('[data-toggle="tooltip"]').tooltip({
        container: 'body',
    })

    toastr.options = {
        "closeButton": true,
        "debug": false,
        "newestOnTop": false,
        "progressBar": false,
        "positionClass": "toast-bottom-full-width",
        "preventDuplicates": true,
        "onclick": null,
        "showDuration": "100",
        "hideDuration": "1000",
        "timeOut": "7000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "slideDown",
        "hideMethod": "slideUp"
    }

    $('#callModal').on('show.bs.modal',function(elt){$('#callModal form #telValue').val('');});
    $('#callModal').on('shown.bs.modal',function(elt){$('#callModal form #telValue').focus();});
    $('#callModal').on('hide.bs.modal',function(elt){$('#callModal form #telValue').blur();});

    $('#callModal form').on('submit', function(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        generate_call($('#callModal form #telValue').val())
        $('#callModal form #telValue').val('')
        return false;
    });

    $('.callable').tooltip({
        title : 'Click2call',
        container: 'body',
    })

    $(document).on('click', '.callable', function(event){
        if (filter_exten($(this).text()).length > 1) {
            generate_call($(this).text());
        };
    });

    $(document).keypress(function(event) {
        if (!event.metaKey) {
            var tag = event.target.tagName.toLowerCase();
            // r
            if (tag != 'input' && event.charCode == 114 && typeof refreshState == 'function') {refreshState()}
            // c
            else if (tag != 'input' && event.charCode == 99) {$('#callModal').modal('show')}
            // esc
            else if (tag != 'input' && event.charCode == 27) {
                if (!$("#callModal").is(':visible') && $("#contact-back-to-list")) {
                    location.pathname = $(".input-group a.btn:first").attr('href')
                }
            }
            // h
            else if (tag != 'input' && event.charCode == 104 && window.location.pathname != DASHBOARD_URI) {window.location.pathname = DASHBOARD_URI;}
        }
    });

    if ($('[data-whois-num]').length > 6) {
        $.ajax({
        url: "/contacts/all.json",
        method: "GET",
        success: function(d, status) {
                if (d.data) {
                    var contacts = {};
                    d.data.forEach(function(el) {
                        if (el['telephoneNumber']) {

                            if (contacts[el['telephoneNumber']] === undefined) {
                                contacts[el['telephoneNumber']] = [];
                            }
                            contacts[el['telephoneNumber']].push(el['cn'])
                        }

                        if (el['mobile']) {

                            if (contacts[el['mobile']] === undefined) {
                                contacts[el['mobile']] = [];
                            }
                            contacts[el['mobile']].push(el['cn'])
                        }
                    });
                    $('[data-whois-num]').each(function() {
                        var num = $(this).attr('data-whois-num');
                        if (contacts[num]) {
                            var t = contacts[num][0]
                            if ($(elt).attr('data-whois-suf')) {
                                t = $(elt).attr('data-whois-suf')
                            }
                            $(this).text(t)
                            $(this).attr('style', 'display:inline');
                        }
                    });
                } else {
                    console.error("Unknow respons");
                }
            },
            error: function(xhr, state, d){
                console.error("can find name");
            }
        });
    } else if($('[data-whois-num]').length < 7){
        $('[data-whois-num]').each(function() {
            var elt = this;
            whois($(this).attr('data-whois-num'), function(err, names){
                if (!err){
                    var t = names[0].cn
                    if ($(elt).attr('data-whois-suf')) {
                        t += $(elt).attr('data-whois-suf')
                    }
                    $(elt).text(t)
                    $(elt).attr('style', 'display:inline');
                }
            })
        })

    }

});