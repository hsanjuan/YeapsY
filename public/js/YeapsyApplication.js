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

// User applications view

var ApplicationPool = {
    resource : "application",
    actions : {
        get : function(callback){
            Yeapsy.request.getPool(ApplicationPool.resource,
                                   callback)
        }
/*
        del : function(callback){
            var sel = Yeapsy.dt.selectedRows($dt_applications);
            for (var i=0; i < sel.length; i++){
                var id = $dt_applications.fnGetData(sel[i]).id;
                Application.actions.del(id,callback);
            };
        },
*/
    },

    callbacks : {
        get : function(pool_json){
            Yeapsy.dt.multiInsert($dt_applications, pool_json);

            //update dashboard with information
            var pending = 0;
            var accepted = 0;
            for (var i = 0; i < pool_json.length; i++){
                var state = pool_json[i].state;
                if (state == 0)//pending
                    pending++;
                else if (state == 1)//accepted
                    accepted++;
            }

            $('.n_apps_pending', $dashboard).text(pending);
            $('.n_apps_accepted', $dashboard).text(accepted);
            $('.n_apps', $dashboard).text(pool_json.length);
        }
    }
};


var Application = {
    resource : "application",
    actions : {
        get : function(id, callback) {
            Yeapsy.request.get(Application.resource,
                               callback,
                               id);
        },

        post : function(data, callback) {
            Yeapsy.request.post(Application.resource,
                                callback,
                                data);
        },
/*
        put : function(id, data, callback){
            Yeapsy.request.put(Application.resource,
                                callback,
                                id, data);
        },
*/
        del : function(id, callback){
            Yeapsy.request.del(Application.resource,
                               callback,
                               id);
        }
    },
    callbacks : {
        getApplication : function(json){
            // Fill in application information table
            $('table#application', $application_info).html(Application.app_table_trs(json));
        },

        post : function(json){
            // Submit application callback
            $dt_applications.fnAddData(json);
            Yeapsy.helper.popMessage("Success","application submitted. You should receive a confirmation email.");
            showView('#applications',true);
        },

        del : function(json){
            Yeapsy.helper.popMessage("Success",
                                     "application deleted from the system");
            Yeapsy.dt.del($dt_applications,json);
            showView('#applications');
        }
    },
    state_str : function(index) {
        // Translate numberical to string state
        if (index == null) return "";
        return ["Pending review",
                "Accepted",
                "Rejected",
                "Waiting list",
                "Other"][index];
    },
    color_state : function(state){
        // Colorize the state string and wrap it in a span
        var color;
        switch (state){
        case 'Pending review':
        case 'Waiting list':
            color = 'orange';
            break;
        case 'Accepted':
            color = 'green';
            break;
        case 'Rejected':
            color = 'red';
            break;
        case 'Other':
            color = 'black';
            break;
        };
        return '<span style="color:'+color+'; font-weight:bold;">'+state+'</span>';
    },
    app_table_trs : function(json){
        // Generate the rows for the application table information
        json = Yeapsy.helper.sanitizeJSON(json);
        var html = '\
  <tr>\
    <td class="label_column">ID / Application state</td>\
    <td>'+json['id']+' / '+Application.color_state(json['state'])+'</td>\
  </tr>\
  <tr>\
    <td class="label_column">Event name</td>\
    <td>'+json['event_name']+'</td>\
  </tr>\
  <tr>\
    <td class="label_column">Application data</td>\
    <td><pre>'+json["application_data"]+'</pre></td>\
  </tr>';
        return html;
    },
    onSubmitCreate : function(){
        // Submit listener
        var data = Yeapsy.helper.serializeForm(this);
        Application.actions.post(data,Application.callbacks.post);
        return false;
    },
    cleanup : function(){
        // Cleanup table
        $dt_applications.fnClearTable();
        var empty = {}
        Application.callbacks.getApplication(empty);
    }
};


$(document).ready(function(){

    // Delete a user application, ask for confirmation
    $('button#remove_application', $application_info).click(
        function(){
            var id = $application_info.attr('application_id');
            var html = '<div title="Delete application?">\
<p><span class="ui-icon ui-icon-alert" style="float:left; margin:0 7px 20px 0;">\
</span>Your application will be removed from the system. Are you sure?</p></div>';
            $(html).dialog({
                resizable: false,
                height:140,
                modal: true,
                buttons: {
                    Yes: function() {
                        Application.actions.del(id,Application.callbacks.del);
                        $(this).dialog("close");
                    },
                    Cancel: function() {
                        $(this).dialog("close");
                    }
                }
            });
            return false;
        }
    );

    $('form#application_create',$event_info).submit(Application.onSubmitCreate);

    $dt_applications = $('table#dt_applications',$applications).dataTable({
        'bJQueryUI' : true,
        'bAutoWidth': false,
        "sDom": '<"H"lTfr>t<"F"ip>',
        "oTableTools": {
            "aButtons": [
                {
                    "sExtends":    "collection",
                    "sButtonText": "Export to",
                    "aButtons":    [ { "sExtends" : "csv",
                                       "sTitle" : "applications"
                                     }
                                   ]
                }
            ],
            "sSwfPath": "swf/copy_cvs_xls.swf"
        },
        'aoColumns' : [
            {/* ID */
                'mDataProp': 'id',
                'bSearchable' : true,
                'bVisible' : false,
                'sWidth' : '30px',
                'sClass' : 'resource_id'
            },
            {
                'mDataProp': 'event_id',
                'bSearchable' : true,
                'bVisible' : false
            },
            {
                'mDataProp': 'event_name',
                'bSearchable' : true,
                'bVisible' : true
            },
            {
                'mDataProp': 'applicant_id',
                'bSearchable' : true,
                'bVisible' : false
            },
            {
                'mDataProp': 'applicant_username',
                'bSearchable' : true,
                'bVisible' : false
            },
            {
                'mDataProp': 'application_data',
                'bSearchable' : true,
                'bVisible' : false
            },
            {
                'mDataProp': 'state',
                'bSearchable' : true,
                'bVisible' : true,
                'sWidth' : '150px',
                'fnRender' : function(o,val){
                    return Application.state_str(val);
                }
            },
            {
                'mDataProp': 'app_time',
                'bSearchable' : true,
                'bVisible' : true,
                'fnRender' : function(o,val){
                    return Yeapsy.helper.date(val);
                },
                'sWidth' : '110px'
            }
        ],
        'aoColumnDefs' : [
            {
                "sDefaultContent": "None",
                "aTargets": [ -1 ]
            }
        ]
    });

    // Listen to clicks on the application table rows and show the app
    $('tbody tr', $dt_applications).live("click",function(){
        var json = $dt_applications.fnGetData(this);
        if (!json) return false;
        Application.callbacks.getApplication(json);
        $application_info.attr('application_id',json['id']);
        showView('#application_info', true, json['id']);
        return false;
    });
});