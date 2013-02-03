/******************************************************************************
*     Copyright © 2012 Hector Sanjuan                                         *
*                                                                             *
*     This file is part of Yeapsy.                                            *
*                                                                             *
*     Yeapsy is free software: you can redistribute it and/or modify          *
*     it under the terms of the GNU General Public License as published by    *
*     the Free Software Foundation, either version 3 of the License, or       *
*     (at your option) any later version.                                     *
*                                                                             *
*     Yeapsy is distributed in the hope that it will be useful,               *
*     but WITHOUT ANY WARRANTY; without even the implied warranty of          *
*     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the           *
*     GNU General Public License for more details.                            *
*                                                                             *
*     You should have received a copy of the GNU General Public License       *
*     along with Yeapsy.  If not, see <http://www.gnu.org/licenses/>.         *
*                                                                             *
******************************************************************************/

//Yeapsy offers functionality to get, modify resources and many helpers.

var Yeapsy = {
    request : {
        // After a request is completed, then session timeout is resetted
        getPool : function(resource, cb) {
            $.ajax({
                url: resource,
                type: "GET",
                dataType: "json",
                success: function(res){
                    if (cb)
                        cb(res);
                },
                error: function(err){
                    Yeapsy.helper.onError(err.responseText);
                },
                complete: function(){
                    Yeapsy.helper.resetTimeout();
                }
            });
        },

        get : function(resource, cb, id) {
            $.ajax({
                url: resource + '/' + id,
                type: "GET",
                dataType: "json",
                success: function(res){
                    Yeapsy.helper.resetTimeout();
                    if (cb)
                        cb(res);
                },
                error: function(err){
                    Yeapsy.helper.onError(err.responseText);
                    showView('#dashboard', true)
                },
                complete: function(){
                    Yeapsy.helper.resetTimeout();
                }
            });
        },
        post : function(resource, cb, data) {
           $.ajax({
               url: resource,
               type: "POST",
               dataType: "json",
               contentType: "application/json", // Important
               data : JSON.stringify(data),
               success: function(res){
                   if (cb)
                       cb(res);
               },
               error: function(err){
                   Yeapsy.helper.onError(err.responseText);
               },
               beforeSend: Yeapsy.helper.waitOn,
               complete: function(){
                   Yeapsy.helper.resetTimeout();
                   Yeapsy.helper.waitOff();
               }
            });
        },
        put : function(resource, cb, id, data){
           $.ajax({
               url: resource + '/' + id,
               type: "PUT",
               dataType: "json",
               contentType: "application/json", // Important
               data : JSON.stringify(data),
               success: function(res){
                   if (cb)
                       cb(res);
               },
               error: function(err){
                   Yeapsy.helper.onError(err.responseText);
               },
               complete: function(){
                   Yeapsy.helper.resetTimeout();
               }
            });
        },
        del : function(resource, cb, id){
           $.ajax({
               url: resource + '/' + id,
               type: "DELETE",
               dataType: "json",
               contentType: "application/json",
               success: function(res){
                   if (cb)
                       cb(res);
               },
               error: function(err){
                   Yeapsy.helper.onError(err.responseText);
               },
               complete: function(){
                   Yeapsy.helper.resetTimeout();
               }
           });
        }
    },
    dt : { //DataTable helpers
        getRowPosition : function(dt,id){
            // Returns the row position of an ID in a dt
            var trs = dt.$('tr');
            var row_pos = -1;
            var data;
            for (var i=0; i < trs.length; i++){
                data = dt.fnGetData(trs[i]);

                if (data.id == id){
                    row_pos = dt.fnGetPosition(trs[i])
                    break;
                };
            };
            return row_pos;
        },
        getData : function(dt, id){
            // Returns the data of an element in a dt, given its ID
            return dt.fnGetData(Yeapsy.dt.getRowPosition(dt,id));
        },
        multiInsert : function(dt,json){
            // Cleans and inserts several new rows in a dt
            dt.fnClearTable();
            dt.fnAddData(json);
        },
        insert : function(dt,item){
            // Insert a single row in a dt
            dt.fnAddData(item);
        },
        del : function(dt,item){
            // Delete a single row in a dt. Item must have ID in it.
            dt.fnDeleteRow(Yeapsy.dt.getRowPosition(dt,item['id']),
                           null,true);
        },
        update : function(dt,item){
            // Update a single item, provided it is present in dt
            dt.fnUpdate(item,
                        Yeapsy.dt.getRowPosition(dt,item['id']),
                        undefined, false, false);
        },
        selectedRows : function(oTableLocal){
            // Returns the data from rows selected in a datatable
            var aReturn = new Array();
            var aTrs = oTableLocal.fnGetNodes();

            for ( var i=0 ; i<aTrs.length ; i++ )
            {
                if ( $(aTrs[i]).hasClass('row_selected') )
                {
                    aReturn.push( aTrs[i] );
                }
            }
            return aReturn;
        }
    },

    helper : { // Helpers
        serializeForm : function(form){
            // Prepare form to be transmitted to server
            // Serializes it as array and then creates
            // a JSON object out of it,
            // with empty values where undefined
            var o = {};
            var a = $(form).serializeArray();
            $.each(a, function() {
                if (o[this.name] !== undefined) {
                    if (!o[this.name].push) {
                        o[this.name] = [o[this.name]];
                    }
                    o[this.name].push(this.value || '');
                } else {
                    o[this.name] = this.value || '';
                };
            });
            return o;
        },
        sanitizeJSON : function(json){
            // Replaces null keys with empty strings in a JSON object
            for (var key in json){
                if (json[key] == null)
                    json[key] = '';
            };
            return json;
        },
        date : function(date_string){
            // Returns a date string after parsing ruby date
            if (!date_string) return "";
            var arr,day, month, year;
            //Ruby 1.9 and 1.8 differ in how they give dates
            if (date_string.indexOf('-') < 0) {//ruby 1.8
                arr = date_string.split(' ');
                day = arr[2];
                month = arr[1];
                year = arr[5];
            }
            else {//ruby 1.9
                arr = date_string.split(' ')[0].split('-');
                day = arr[2];
                month = arr[1];
                year = arr[0];
            };

            return day+'-'+month+'-'+year;
        },
        onError : function(resp){
            // Shows an error message when a request fails
            try {
                error = JSON.parse(resp);
            }
            catch (e) {
                error = { title: "Server exception", message: resp};
            };


            var title="Unkown error"
            var message=error;
            if (error.title){
                title = error.title;
                message = error.message;
            };
            Yeapsy.helper.popError(title,message);
        },
        popError : function(title,message){
            // Pops up an error message, position differ if we are logged in or not
            var html = '<p>\
<span class="ui-icon ui-icon-alert" \
  style="float: left; \
  margin-right: .3em;"></span>\
<b>'+title+'</b>: '+message+'\
<span class="ui-icon ui-icon-closethick" \
  style="float: right;"></span>\</p>';

            var message_bar = $('div#errors')
            var northClosed = $layout.state.north.isClosed;
            var top =  northClosed ? 0 : $center.offset().top + 2;;
            message_bar.css('top',top);
            message_bar.append(html);
            message_bar.slideDown("normal", "easeInOutBack");
            //hide after 5 sec
            setTimeout(function(){
                message_bar.trigger('click');
            }, 15000);
        },
        popMessage : function(title,message){
            // Iden with information message
            var html = '<p>\
<span class="ui-icon ui-icon-info" \
  style="float: left; \
  margin-right: .3em;"></span>\
<b>'+title+'</b>: '+message+'\
<span class="ui-icon ui-icon-closethick" \
  style="float: right;"></span>\</p>';

            var message_bar = $('div#messages');
            var northClosed = $layout.state.north.isClosed;
            var top =  northClosed ? 0 : $center.offset().top + 2;
            message_bar.css('top',top);
            message_bar.append(html);
            message_bar.slideDown("normal", "easeInOutBack");
            //hide after 5 sec
            setTimeout(function(){
                message_bar.trigger('click');
            }, 5000);
        },
        countryOptions : function(){
            // Creates <options> from the list of countries
            var str = ''
            for (var i=0; i<country_arr.length; i++)
                str += '<option value="'+country_arr[i]+'">'+country_arr[i]+'</option>';
            return str;
        },
        getURLvars : function() {
            // Parses url vars into an object
            var vars = {};
            var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
                vars[key] = value;
            });
            return vars;
        },
        waitOn : function() {
            // Set mouse on waiting
            $center.css('cursor', 'wait');
        },
        waitOff : function() {
            // Set mouse back to normal
            $center.css('cursor', 'auto');
        },
        logoutCountdown : function(mins, secs, $container, trigger){
            // Places a countdown in a places of the DOM and triggers certain function
            // when it comes to 0
            var t_secs = (mins * 60) + secs;

            var secs_str = secs;
            if (secs < 10) secs_str = '0'+secs;
            var mins_str = mins;
            if (mins < 10) mins_str = '0'+mins;

            $container.html('\
<span class="mins">'+mins_str+'</span>:<span class="secs">'+secs_str+'</span>');

            clockInterval = setInterval(function($container, trigger_f){
                var secs = parseInt($('.secs',$container).text(),10);
                var mins = parseInt($('.mins',$container).text(),10);

                if (secs == 0 && mins == 0) {
                    trigger_f();
                    return;
                }

                if (secs == 0) {
                    // If we are close to timout show modal dialog and force user to refresh
                    if (mins == 5){
                        var dialog_html = '<div title="Renew session?">\
<p><span class="ui-icon ui-icon-alert" style="float:left; margin:0 7px 20px 0;">\
</span>Your session will be automaticly logged out in 5 minutes. Click renew to keep it active.</p></div>';
                        $(dialog_html).dialog({
                            resizable: false,
                            height: 140,
                            modal: true,
                            buttons: {
                                Renew: function(){
                                    UserPool.actions.get();
                                    $(this).dialog("close");
                                }
                            }
                        })
                    }

                    secs = 59;
                    mins --;
                }
                else secs--;

                var secs_str = secs;
                if (secs < 10) secs_str = '0'+secs;
                var mins_str = mins;
                if (mins < 10) mins_str = '0'+mins;

                $('.secs',$container).text(secs_str);
                $('.mins',$container).text(mins_str);

            },1000, $container, trigger);
        },
        resetTimeout : function(){
            // Removes the timeout if existed and resets it
            clearInterval(clockInterval);
            Yeapsy.helper.logoutCountdown(
                LOGOUT_TIMEOUT,0,
                $('#countdown', $south),
                YeapsyAuth.actions.logout
            );
        },
        avatar : function(email, size, style){
            // Talk to gravatar to form the <img> tag of the avatar.
            // Possibility of adding size for the request and style tags.
            if (!style) style = '';

            var hash;
            if (!email)
                hash = '00000000000000000000000000000000';
            else
                hash = Crypto.MD5(email.replace(/\s/g,"").toLowerCase());


            var size_str = size ? 'width="'+size+'" height="'+size+'"':'';
            var src = 'https://gravatar.com/avatar/'+hash

            if (size) src += '?s='+size;

            var avatar = '<img '+size_str+' style="'+style+'" src="'+src+'" />';

            return avatar;
        },
        randomLoginNumber: function(){
            return Math.floor(Math.random() * 12 + 3)
        },
        parseTwitterDate: function(tw_date){
            var day = tw_date.substr(4,6)
            // get the two digit hour //
            var hour = tw_date.substr(11, 5);
            // convert to AM or PM //
            return day// + ' ' + hour
        },
        setHash: function(hash){
            if (hash == '#login') hash = '';
            _ignoreHashChange = true;
            window.location.hash = hash;
        },
        showCurrentHash: function(){
            var hash = window.location.hash
            var hash_arr = null;
            if (hash && hash.indexOf('+') > 0)
                hash_arr = hash.slice(1).split('+');
            else if (hash)
                hash_arr = [hash.slice(1)];

            if (hash_arr && hash_arr.length > 1){
                switch (hash_arr[0]){
                case "event_info":
                    //open event view
                    Event.actions.get(
                        hash_arr[1],
                        function(json){
                            Event.callbacks.getEvent(json);
                            Event.callbacks.getEventEdit(json);
                        }
                    );
                    showView('#event_info', true, false);
                    break;
                case "event_application_info":
                    var event_id = hash_arr[1]
                    var app_id = hash_arr[2]
                    if (!app_id)
                        showView('#dashboard', true, false);

                    // Get the specific application for this event and show it
                    EventApplication.actions.get(
                        event_id,
                        app_id,
                        function(json){
                            EventApplication.callbacks.getEventApplication(json)
                        }
                    );
                    showView('#event_application_info', true, false);

                    // Fill in event because we can go back
                    Event.actions.get(
                        event_id,
                        function(json){
                            Event.callbacks.getEvent(json);
                            Event.callbacks.getEventEdit(json);
                        }
                    );

                    // Fill in applications pool for the event because
                    // we can go back to it
                    EventApplicationPool.actions.get(event_id,
                                                     EventApplicationPool.callbacks.get)
                    break;
                case "application_info":
                    Application.actions.get(
                        hash_arr[1],
                        function(json){
                            Application.callbacks.getApplication(json)
                        }
                    );
                    showView('#application_info', true, false);
                    break;
                default:
                    showView('#dashboard', true, false);
                };
            }
            else if (hash_arr && hash_arr.length == 1){
                showView('#'+hash_arr[0], true, false);
            }
            else
                showView('#dashboard', true);
        }
    }
};

$(document).ready(function(){

    // Listen to click on messages
    $('div#messages,div#errors').click(function(){
        $(this).slideUp("normal", "easeInOutBack");
        $(this).empty();
    });

    // General listeners on what happens when clicking on a certain button
    $(document).on('click', 'button.show', function(){
        showView($(this).val(), true);
        return false;
    });

    $(document).on('click', 'a.show', function(){
        showView($(this).attr('href'), true);
        return false;
    });

    $(document).on('click', 'button.help', function(){
        toggleEastView($(this).val());
        return false;
    });

    $(document).on('click', 'a.help', function(){
        toggleEastView($(this).attr('href'));
        return false;
    });

    // Refresh buttons listener
    $('a.refresh').click(function(){
        switch ($(this).attr('href')){
        case "#users":
            UserPool.actions.get();
            break;
        case "#events":
            EventPool.actions.get(EventPool.callbacks.get);
            break;
        case "#applications":
            ApplicationPool.actions.get(ApplicationPool.callbacks.get);
            break;
        }
        return false;
    });

    $(window).bind('hashchange', function(e){
        if (_ignoreHashChange)
            _ignoreHashChange = false
        else
            Yeapsy.helper.showCurrentHash();
    })
});
