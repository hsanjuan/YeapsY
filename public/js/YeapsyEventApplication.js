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

// Event applications view

var EventApplicationPool = {
    actions: {
        get: function(event_id, callback){
            Yeapsy.request.getPool('event/'+event_id+'/application',
                                  callback);
        }
    },
    callbacks: {
        get: function(pool_json){
            Yeapsy.dt.multiInsert($dt_event_applications, pool_json);
            showView('#event_applications', true);
        }
    }
};

var EventApplication = {
    actions : {
        get : function(event_id, id, callback){
            Yeapsy.request.get('event/'+event_id+'/application',
                               callback,
                               id);
        },
        put : function(event_id, id, data, callback){
            Yeapsy.request.put('event/'+event_id+'/application',
                                callback,
                                id, data);
        }
    },
    callbacks : {
        put : function(json){
            // Modify application, check if the modified application
            // has mark or average, or set it blank
            if (!json['mark']) json['mark']="";
            if (!json['average']) json['average']="";

            // Update the table
            Yeapsy.dt.update($dt_event_applications, json);
            Yeapsy.helper.popMessage('Success',
                                     'Application updated');
        },
        getEventApplication : function(json){
            // Fill in the information and the tables for editting the state
            // and rating the application
            $('table#event_application',$event_application_info).html(
                EventApplication.event_application_table_trs(json));

            // Add archive checkbox if user is superadmin or event admin
            var event_id = json['event_id'] ? json['event_id'] : -1;
            var event_info = Yeapsy.dt.getData($dt_events,
                                             event_id)
            var admin_id = event_info ? event_info.admin_id : -1;

            if (rank == 0 || (rank == 1 && admin_id == user_id)){
                $('form#event_application_archive',
                  $event_application_info).show();
                $('form#event_application_archive table',
                  $event_application_info).html(
                    EventApplication.event_application_archive_trs(json));
            } else {
                $('form#event_application_archive',
                  $event_application_info).hide();
            }

            $('form#event_application_edit table',$event_application_info).html(
                EventApplication.event_application_edit_trs(json));
            $('form#event_application_rate table',$event_application_info).html(
                EventApplication.event_application_rate_trs(json));
        }
    },
    event_application_table_trs : function(json) {
        // Generate rows with the application information
        var json = Yeapsy.helper.sanitizeJSON(json);
        var avatar = Yeapsy.helper.avatar(json['email'],null,'float:right')
        var html = '\
  <tr>\
     <td class="label_column">Profile picture</td>\
     <td>\
        '+avatar+'\
     </td>\
  </tr>\
  <tr>\
    <td class="label_column">Username / ID</td>\
    <td>'+json["username"]+' / '+json['id']+'</td>\
  </tr>\
  <tr>\
    <td class="label_column">Name</td>\
    <td>'+json["name"]+'</td>\
  </tr>\
  <tr>\
    <td class="label_column">Email</td>\
    <td>'+json["email"]+'</td>\
  </tr>\
  <tr>\
    <td class="label_column">Birth Date</td>\
    <td>'+json["birth_date"]+'</td>\
  </tr>\
  <tr>\
    <td class="label_column">Birth Place</td>\
    <td>'+json["birth_place"]+'</td>\
  </tr>\
  <tr>\
    <td class="label_column">Gender</td>\
    <td>'+json["gender"]+'</td>\
  </tr>\
  <tr>\
    <td class="label_column">Nationality</td>\
    <td>'+json["nationality"]+'</td>\
  </tr>\
  <tr>\
    <td class="label_column">Passport number</td>\
    <td>'+json["passport"]+'</td>\
  </tr>\
  <tr>\
    <td class="label_column">Address</td>\
    <td><pre>'+json["address"]+'</pre></td>\
  </tr>\
  <tr>\
    <td class="label_column">Country</td>\
    <td>'+json["country"]+'</td>\
  </tr>\
  <tr>\
    <td class="label_column">Telephone</td>\
    <td>'+json["telephone"]+'</td>\
  </tr>\
  <tr>\
    <td class="label_column">Organization</td>\
    <td>'+json["organization"]+'</td>\
  </tr>\
  <tr>\
    <td class="label_column">About (public)</td>\
    <td><pre>'+json["about_public"]+'</pre></td>\
  </tr>\
  <tr>\
    <td class="label_column">About (private)</td>\
    <td><pre>'+json["about_private"]+'</pre></td>\
  </tr>\
  <tr>\
    <td class="label_column">Application data</td>\
    <td><pre>'+json["application_data"]+'</pre></td>\
  </tr>\
  <tr>\
    <td class="label_column">Application time</td>\
    <td>'+json["app_time"]+'</td>\
  </tr>';
        return html;
    },

    event_application_edit_trs : function(json){
        // Generate event edition table rows. Allows changing the event state
        json = Yeapsy.helper.sanitizeJSON(json);
        var html = '\
  <tr>\
    <td class="label"><label>State</label></td>\
    <td>\
       <select id="event_application_state" type="text" name="state">\
          <option value="0" '+
            (json['state'] == 'Pending review' ? 'selected="selected"' : '')+
            '>Pending review</option>\
          <option value="1" '+
            (json['state'] == 'Accepted' ? 'selected="selected"' : '')+
            '>Accepted</option>\
          <option value="2" '+
            (json['state'] == 'Rejected' ? 'selected="selected"' : '')+
            '>Rejected</option>\
          <option value="3" '+
            (json['state'] == 'Waiting list' ? 'selected="selected"' : '')+
            '>Waiting list</option>\
          <option value="4" '+
            (json['state'] == 'Other' ? 'selected="selected"' : '')+
            '>Other</option>\
       </select>\
       <input type="hidden" name="application_id" value="'+json['id']+'" />\
       <input type="hidden" name="event_id" value="'+json['event_id']+'" />\
       <div class="tip">CAUTION! Changing this value will trigger the sending of an information email to the applicant. Make sure all the leaders have agreed before changing this value.</div>\
   </td>\
  </tr>';

        return html;
    },

    event_application_archive_trs : function(json){
        var checked = json['archived'] ? 'checked="checked"' : '';
        var html = '\
  <tr>\
    <td class="label"><label>Archived</label></td>\
    <td>\
       <input type="checkbox" name="archived" value="true" '+checked+' />\
       <input type="hidden" name="application_id" value="'+json['id']+'" />\
       <input type="hidden" name="event_id" value="'+json['event_id']+'" />\
       <div class="tip">Archived application are only visible to event administrators, not leaders.</div>\
   </td>\
  </tr>';

        return html;
    },

    event_application_rate_trs : function(json){
        // Generate rows for event rating table - stars
        json = Yeapsy.helper.sanitizeJSON(json);
        var html = '\
<tr>\
    <td class="label"><label>Rating</label></td>\
    <td>\
       '+EventApplication.starrify_with_links(json['mark'])+'\
       <div class="tip">You can rate this application here. Rating is NOT visible toanyone, including the applicant. Average ratings shown in the list of applications are visible only to event administrator and event leaders.</div>\
       <input type="hidden" name="old_mark" value="'+json['mark']+'" />\
       <input type="hidden" name="application_id" value="'+json['id']+'" />\
       <input type="hidden" name="event_id" value="'+json['event_id']+'" />\
       <input type="hidden" name="evaluation_id" value="'+json['evaluation_id']+'" />\
    </td>\
</tr>\
';
        return html;
    },

    onSubmitEdit : function(){
        // Edit application state, ask for confirmation
        var data = Yeapsy.helper.serializeForm(this);

        var html = '<div title="Change application state?">\
<p><span class="ui-icon ui-icon-alert" style="float:left; margin:0 7px 20px 0;">\
</span>This will send an email to the applicant informing of the new state. Are you sure?</p></div>';
        $(html).dialog({
            resizable: false,
            height:140,
            modal: true,
            buttons: {
                Yes: function() {
                    EventApplication.actions.put(data['event_id'],
                                                 data['application_id'],
                                                 data,
                                                 EventApplication.callbacks.put);
                    $( this ).dialog( "close" );
                },
                Cancel: function() {
                    $( this ).dialog( "close" );
                }
            }
        });
        return false;
    },

    onSubmitArchive : function(){
        // Edit archive state
        var data = Yeapsy.helper.serializeForm(this);
        if (!data['archived']) data['archived'] = false;
        else data['archived'] = true;
        EventApplication.actions.put(data['event_id'],
                                     data['application_id'],
                                     data,
                                     EventApplication.callbacks.put);
        return false;
    },

    onSubmitRate : function(){
        // Submit new rating listener
        var form = $(this).parents('form#event_application_rate');
        var data = Yeapsy.helper.serializeForm(form);
        var old_mark = $('input[name="old_mark"]',form).val();
        // Stars from 1..5, but mark format is 0..10, so multiply
        var mark = parseInt($(this).text(), 10) * 20;
        data['mark'] = mark;
        // If no mark was set, create new mark, otherwise update
        if (old_mark)
            Evaluation.actions.put(data['evaluation_id'],data,
                                   Evaluation.callbacks.put);
        else
            Evaluation.actions.post(data, Evaluation.callbacks.post);
        return false;
    },

    starrify: function(val){
        // Generate the rating stars html list
        if (!val) val = 0;

        var value = Math.floor(val / 20);
        var ul_class = "";

        switch (value) {
        case 0:
            ul_class = 'nostar';
            break;
        case 1:
            ul_class = 'onestar';
            break;
        case 2:
            ul_class = 'twostar';
            break;
        case 3:
            ul_class = 'threestar';
            break;
        case 4:
            ul_class = 'fourstar';
            break;
        case 5:
            ul_class = 'fivestar';
            break;
        };
        var html = '\
        <ul class="rating '+ul_class+'">\
            <li class="one"></li>\
            <li class="two"></li>\
            <li class="three"></li>\
            <li class="four"></li>\
            <li class="five"></li>\
        </ul>';

        return html;
    },
    starrify_with_links: function(val){
        // Generate the rating stars with links that can be
        // clicked to submit new rating
        if (!val) val = 0;

        var value = Math.floor(val / 20);
        var ul_class = "";

        switch (value) {
        case 0:
            ul_class = 'nostar';
            break;
        case 1:
            ul_class = 'onestar';
            break;
        case 2:
            ul_class = 'twostar';
            break;
        case 3:
            ul_class = 'threestar';
            break;
        case 4:
            ul_class = 'fourstar';
            break;
        case 5:
            ul_class = 'fivestar';
            break;
        };
        var html = '\
 <ul class="rating '+ul_class+'">\
   <li class="one"><a href="#" title="1 Star">1</a></li>\
   <li class="two"><a href="#" title="2 Stars">2</a></li>\
   <li class="three"><a href="#" title="3 Stars">3</a></li>\
   <li class="four"><a href="#" title="4 Stars">4</a></li>\
   <li class="five"><a href="#" title="5 Stars">5</a></li>\
 </ul>';

        return html;
    },
    cleanup : function(){
        // Remove personal information
        $dt_event_applications.fnClearTable();
        var empty = {};
        EventApplication.callbacks.getEventApplication(empty);
    }

};

$(document).ready(function(){

    // When changing the state of an application trigger a submit
    $('select#event_application_state', $event_application_info).live(
        "change", function(){
            $(this).parents('form#event_application_edit').trigger('submit');
        }
    );

    $('input[name="archived"]', $event_application_info).live(
        "click", function(){
            $(this).parents('form#event_application_archive').trigger('submit');
        }
    );

    $('form#event_application_edit',
      $event_application_info).submit(EventApplication.onSubmitEdit);

    $('form#event_application_archive',
      $event_application_info).submit(EventApplication.onSubmitArchive);

    // Trigger a new rating when clicking on a star
    $('form#event_application_rate a',
      $event_application_info).live('click', EventApplication.onSubmitRate);

    $dt_event_applications = $('table#dt_event_applications',
                              $event_applications).dataTable({
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
                'bVisible' : true,
                'sWidth' : '30px',
                'sClass' : 'resource_id'
            },
            {/* Username */
                'mDataProp': 'username',
                'bSearchable' : true,
                'bVisible' : false
            },
            {/* Name */
                'mDataProp': 'name',
                'bSearchable' : true,
                'bVisible' : true
            },
            {/* Bdate */
                'mDataProp': 'birth_date',
                'bSearchable' : true,
                'bVisible' : false,
                'fnRender' : function(o,val){
                    return Yeapsy.helper.date(val);
                }
            },
            {
                'mDataProp': 'birth_place',
                'bSearchable' : true,
                'bVisible' : false
            },
            {/* Gender */
                'mDataProp': 'gender',
                'bSearchable' : true,
                'bVisible' : false
            },
            {/* Email */
                'mDataProp': 'email',
                'bSearchable' : true,
                'bVisible' : true
            },
            {/* Nationality */
                'mDataProp': 'nationality',
                'bSearchable' : true,
                'bVisible' : false
            },
            {/* Passport */
                'mDataProp': 'passport',
                'bSearchable' : true,
                'bVisible' : false
            },
            {/* Addr */
                'mDataProp': 'address',
                'bSearchable' : true,
                'bVisible' : false
            },
            {/* Country */
                'mDataProp': 'country',
                'bSearchable' : true,
                'bVisible' : true
            },
            {/* Telephone */
                'mDataProp': 'telephone',
                'bSearchable' : true,
                'bVisible' : false
            },
            {/* Orga */
                'mDataProp': 'organization',
                'bSearchable' : true,
                'bVisible' : false
            },
            {/* About public */
                'mDataProp': 'about_public',
                'bSearchable' : true,
                'bVisible' : false
            },
            {/* About priv */
                'mDataProp': 'about_private',
                'bSearchable' : true,
                'bVisible' : false
            },
            {
                'mDataProp': 'application_data',
                'bSearchable' : true,
                'bVisible' : false
            },
            {
                'mDataProp': 'app_time',
                'bSearchable' : true,
                'sWidth' : '250px',
                'bVisible' : true
            },
            {
                'mDataProp': 'event_id',
                'bSearchable' : true,
                'bVisible' : false
            },
            {
                'mDataProp': 'state',
                'bSearchable' : true,
                'sWidth' : '100px',
                'bVisible' : true,
                'fnRender' : function(o,val){
                    return Application.state_str(val);
                }
            },
            {
                'mDataProp': 'mark',
                'bSearchable' : true,
                'sWidth' : '50px',
                'sType'  : 'numeric',
                'bVisible' : false
            },
            {
                'mDataProp': 'average',
                'bSearchable' : true,
                'sWidth' : '50px',
                'sType'  : 'numeric',
                'bUseRendered' : false,
                'bVisible' : true,
                'fnRender' : function(o,val){
                    return EventApplication.starrify(val);
                }
            },
            {
                'mDataProp': 'evaluation_id',
                'bSearchable' : true,
                'bVisible' : false
            },
            {
                'mDataProp': 'archived',
                'bSearchable' : false,
                'bVisible' : false
            }
        ],
        'aoColumnDefs' : [
            {
                "aTargets": [ -2 ]
            }
        ]
    });

    $('tbody tr', $dt_event_applications).live("click",function(){
        var json = $dt_event_applications.fnGetData(this);
        if (!json) return false;
        EventApplication.callbacks.getEventApplication(json);
        showView('#event_application_info', true,
                 json['event_id'] + '+' + json['id']);
        return false;
    });

});