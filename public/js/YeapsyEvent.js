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

//Operations related to the view of events

var EventPool = {
    resource : "event",
    actions : {
        get : function(callback){
            Yeapsy.request.getPool(EventPool.resource,
                                    callback)
        },
        del : function(callback){
            // Currently not used anywhere
            var sel = Yeapsy.dt.selectedRows($dt_events);
            for (var i=0; i < sel.length; i++){
                var id = $dt_events.fnGetData(sel[i]).id;
                Event.actions.del(id,callback);
            };
        }
    },

    callbacks : {
        get : function(pool_json){
            Yeapsy.dt.multiInsert($dt_events, pool_json);

            //Count the state of the calls and update dashboard information
            var call_leaders = 0;
            var call_pax = 0;
            for (var i = 0; i < pool_json.length; i++){
                var state = pool_json[i].state;
                if (state == 1)//call leaders
                    call_leaders++;
                else if (state == 3)//call participants
                    call_pax++;
            }

            $('.n_call_leaders', $dashboard).text(call_leaders);
            $('.n_call_participants', $dashboard).text(call_pax);
            $('.n_events', $dashboard).text(pool_json.length);
        }
    }
};


var Event = {
    resource : "event",
    actions : {
        get : function(id, callback) {
            Yeapsy.request.get(Event.resource,
                               callback,
                               id);
        },

        post : function(data, callback) {
            Yeapsy.request.post(Event.resource,
                                callback,
                                data);
        },

        put : function(id, data, callback){
            Yeapsy.request.put(Event.resource,
                                callback,
                                id, data);
        },

        del : function(id, callback){
            Yeapsy.request.del(Event.resource,
                                callback,
                                id);
        }
    },
    callbacks : {
        getEvent : function(json){
            // Store name and ID in the DOM
            $event_info.attr('event_id',json['id']);
            $event_info.attr('event_name',json['name']);

            // Generate table rows for event info
            $('table#event',$event_info).html(Event.event_table_trs(json));

            // Generate the application form table
            $('form#application_create table',$event_info).html(
                Event.event_application_trs(json));

            // Hide admin buttons
            $('.event_admin,.event_leader',$event_info).hide();

            // Depending on the rank, show admin buttons
            if (!$.isEmptyObject(json)){
                switch (rank) {
                case 0: //admin sees all
                    $('.event_admin,.event_leader',$event_info).show();
                    break;
                case 1: //admin sees if he's admin or leader
                    if (json['admin_id'] == user_id){
                        $('.event_admin,.event_leader',$event_info).show();
                        break;
                    };
                case 2:
                    var leaders = json['leaders'].split(',');
                    if ($.inArray(username, leaders) > -1)
                        $('.event_leader',$event_info).show();
                    break;
                };

                //If the state is open, then show application form
                switch (json['state']){
                case "Call for leaders":
                case "Open/Call for applications":
                case 1:
                case 3:
                    $('button#apply',$event_info).show();
                    $('form#application_create',$event_info).show();
                    break;
                default:
                    $('button#apply',$event_info).hide();
                    $('form#application_create',$event_info).hide();

                };
            };
        },

        getEventEdit : function(json){
            // Insert information for event edition
            var table = $('form#event_edit table#event_edit_table',$event_edit);
            table.html(Event.event_edit_trs(json));

            // Fill in and Set the country select
            var country = json['country'];
            if (country)
                $('#countries_edit_event option[value="'+country+'"]',
                  table).attr('selected','selected');

            // Start datepicker for the date fields
            $('.date',table).datepicker({
                changeYear: true,
                changeMonth: true,
                dateFormat: 'dd-mm-yy'
            });
        },

        post : function(json){
            // Add new event to the list
            $dt_events.fnAddData(json);
            Yeapsy.helper.popMessage("Success","event created");
            showView('#events');
        },

        put : function(json){
            // Update event in the table
            Yeapsy.dt.update($dt_events,json);

            // Update event info view
            var new_json = Yeapsy.dt.getData($dt_events,json['id'])
            Event.callbacks.getEvent(new_json)

            Yeapsy.helper.popMessage('Success',
                                     'Event updated correctly');
            showView('#event_info',true, json['id']);
        },

        del : function(json){
            // Delete event callback
            Yeapsy.helper.popMessage("Success","event deleted from the system");
            Yeapsy.dt.del($dt_events,json)
            showView('#events');
        }
    },
    state_str : function(index) {
        // Translate event state
        if (index == null) return "";
        return ["Disabled",
                "Call for leaders",
                "On preparation",
                "Open/Call for applications",
                "In course",
                "Closed"][index];
    },
    event_table_trs : function(json){
        // Generate rows with event information
        json = Yeapsy.helper.sanitizeJSON(json);
        var html = '\
  <tr>\
    <td class="label_column">Title / ID</td>\
    <td>'+json["name"]+' / '+json['id']+'</td>\
  </tr>\
  <tr>\
    <td class="label_column">State</td>\
    <td>'+json["state"]+'</td>\
  </tr>\
  <tr>\
    <td class="label_column">Organizer</td>\
    <td>'+json["organizer"]+'</td>\
  </tr>\
  <tr>\
    <td class="label_column">Web</td>\
    <td><a href="'+json["organizer_web"]+'">'+json["organizer_web"]+'</a></td>\
  </tr>\
  <tr>\
    <td class="label_column">Contact phone</td>\
    <td>'+json["organizer_telephone"]+'</td>\
  </tr>\
  <tr>\
    <td class="label_column">Contact email</td>\
    <td><a href="mailto:'+json["organizer_email"]+'">'+json["organizer_email"]+'</a></td>\
  </tr>\
  <tr>\
    <td class="label_column">Administrator</td>\
    <td>'+json["admin_username"]+'</td>\
  </tr>\
  <tr>\
    <td class="label_column">Leaders</td>\
    <td>'+json["leaders"]+'</td>\
  </tr>\
  <tr>\
    <td class="label_column">Description</td>\
    <td><pre>'+json["description"]+'</pre></td>\
  </tr>\
  <tr><td /><td /></tr>\
  <tr>\
    <td class="label_column">Venue</td>\
    <td>'+json["venue"]+'</td>\
  </tr>\
  <tr>\
    <td class="label_column">Town</td>\
    <td>'+json["town"]+'</td>\
  </tr>\
  <tr>\
    <td class="label_column">Country</td>\
    <td>'+json["country"]+'</td>\
  </tr>\
  <tr><td /><td /></tr>\
  <tr>\
    <td class="label_column">Start date</td>\
    <td>'+json["date_start"]+'</td>\
  </tr>\
  <tr>\
    <td class="label_column">End date</td>\
    <td>'+json["date_end"]+'</td>\
  </tr>\
  <tr>\
    <td class="label_column">Deadline for applications</td>\
    <td>'+json["app_deadline"]+'</td>\
  </tr>\
  <tr><td /><td /></tr>\
  <tr>\
    <td class="label_column">Number of participants</td>\
    <td>'+json["n_participants"]+'</td>\
  </tr>\
  <tr>\
    <td class="label_column">Number of leaders</td>\
    <td>'+json["n_leaders"]+'</td>\
  </tr>';
        return html;
    },
    event_application_trs : function(json){
        // Generate rows for the event application form
        var html = '\
  <tr>\
    <td><label>Application text</label></td>\
    <td>\
        <input type="hidden" name="event_id" value="'+json['id']+'" />\
        <textarea name="application_data" style="height:30em;">'+json['app_description']+'</textarea>\
        <div class="tip">Please provide the information requested directly under the each of the questions. You can only submit one application for each event.</div>\
    </td>\
  </tr>\
  <tr>\
    <td><label>Agree with conditions</label></td>\
    <td><input type="checkbox" name="agree" value="agreed" required="required" />\
        <div class="tip">I have read all the information and I agree with any of the conditions stated in the event description or website.</div>\
    </td>\
  </tr>\
  <tr>\
   <td></td>\
   <td><button type="submit"><i class="icon-ok"></i> Submit</button>\
       <button type="reset"><i class="icon-undo"></i> Reset</button></td>\
  </tr>';
        return html;
    },
    selected_state : function(json_state,state){
        // Determines if the states that comes with the JSON
        // is the selected statean option will be the selected state option
        // regardless if json_state comes in number or in string
        // and returns the selected attribute for the <option>
        if (json_state == state) return 'selected="selected"';
        if (json_state == 'Disabled' && state == 0 ||
            json_state == 'Call for leaders' && state == 1 ||
            json_state == 'On preparation' && state == 2 ||
            json_state == 'Open/Call for applications' && state == 3 ||
            json_state == 'In course' && state == 4 ||
            json_state == 'Closed' && state == 5)
            return 'selected="selected"';
        return ''
    },
    event_edit_trs : function(json) {
        // Generate rows for event edition form
        json = Yeapsy.helper.sanitizeJSON(json);
        var html = '\
  <tr>\
    <td><label>Event title</label></td>\
    <td><input type="text" name="name" value="'+json['name']+'"/>\
        <input type="hidden" name="id" value="'+json['id']+'" /></td>\
  </tr>\
  <tr>\
  <td><label>State</label></td>\
    <td><select name="state">\
       <option value="0" '+Event.selected_state(json['state'],0)+'>Disabled</option>\
       <option value="1" '+Event.selected_state(json['state'],1)+'>Call for leaders</option>\
       <option value="2" '+Event.selected_state(json['state'],2)+'>On preparation</option>\
       <option value="3" '+Event.selected_state(json['state'],3)+'>Open/Call for applications</option>\
       <option value="4" '+Event.selected_state(json['state'],4)+'>In course</option>\
       <option value="5" '+Event.selected_state(json['state'],5)+'>Closed</option>\
    </td>\
  </tr>\
  <tr>\
    <td><label>Organizer</label></td>\
    <td><input type="text" name="organizer" value="'+json['organizer']+'"/></td>\
  </tr>\
  <tr>\
    <td><label>Web</label></td>\
    <td><input type="text" name="organizer_web" value="'+json['organizer_web']+'"/></td>\
  </tr>\
  <tr>\
    <td><label>Contact phone</label></td>\
    <td><input type="text" name="organizer_telephone" value="'+json['organizer_telephone']+'"/></td>\
  </tr>\
  <tr>\
    <td><label>Contact email</label></td>\
    <td><input type="text" name="organizer_email" value="'+json['organizer_email']+'"/></td>\
  </tr>\
  <tr>\
    <td><label>Leaders</label></td>\
    <td><input type="text" name="leaders" value="'+json['leaders']+'"/>\
        <div class="tip">Comma separated list of leaders usernames</div>\
    </td>\
  </tr>\
  <tr>\
    <td><label>Description</label></td>\
    <td><textarea name="description">'+json['description']+'</textarea></td>\
  </tr>\
  <tr>\
    <td><label>Venue</label></td>\
    <td><input type="text" name="venue" value="'+json['venue']+'"/></td>\
  </tr>\
  <tr>\
    <td><label>Town</label></td>\
    <td><input type="text" name="town" value="'+json['town']+'"/></td>\
  </tr>\
  <tr>\
    <td><label>Country</label></td>\
    <td><select id="countries_edit_event" name="country">'+Yeapsy.helper.countryOptions()+'</select></td>\
  </tr>\
  <tr>\
    <td><label>Start date</label></td>\
    <td><input type="text" class="date" name="date_start" value="'+json['date_start']+'"/>\
    <div class="tip">dd-mm-yyyy</div>\
    </td>\
  </tr>\
  <tr>\
    <td><label>End date</label></td>\
    <td><input type="text" class="date" name="date_end" value="'+json['date_end']+'"/>\
    <div class="tip">dd-mm-yyyy</div>\
   </td>\
  </tr>\
  <tr>\
    <td><label>Deadline for applications</label></td>\
    <td><input type="text" class="date" name="app_deadline" value="'+json['app_deadline']+'"/>\
    <div class="tip">dd-mm-yyyy</div>\
   </td>\
  </tr>\
  <tr>\
    <td><label>Number of Participants</label></td>\
    <td><input type="text" name="n_participants" value="'+json['n_participants']+'"/></td>\
  </tr>\
  <tr>\
    <td><label>Number of leaders</label></td>\
    <td><input type="text" name="n_leaders" value="'+json['n_leaders']+'"/></td>\
  </tr>\
  <tr>\
    <td><label>Application template</label></td>\
    <td><textarea name="app_description">'+json['app_description']+'</textarea></td>\
  </tr>\
';
        return html;
    },
    onSubmitCreate : function(){
        // Create event listener
        var data = Yeapsy.helper.serializeForm(this);
        Event.actions.post(data,Event.callbacks.post);
        return false;
    },
    onSubmitEdit : function(){
        // Edit event listener
        var data = Yeapsy.helper.serializeForm(this);
        Event.actions.put(data['id'],data,Event.callbacks.put);
        return false;
    },
    cleanup : function(){
        // Remove information from event view
        $dt_events.fnClearTable();
        var empty = {};
        Event.callbacks.getEvent(empty)
        Event.callbacks.getEventEdit(empty);
    }
};

$(document).ready(function(){
    $('input.date',$event_create).datepicker({
        changeYear: true,
        changeMonth: true,
        dateFormat: 'dd-mm-yy'
    });

    $('input.date',$event_edit).datepicker({
        changeYear: true,
        changeMonth: true,
        dateFormat: 'dd-mm-yy'
    });

    // Insert country list in the creation form
    $('select#create_event_countries',$event_create).html(Yeapsy.helper.countryOptions());

    $('button#new_event', $events).click(function(){
        showView('#event_create');
        return false;
    });

    // Scroll to top after applying changes
    $('button#apply', $event_info).click(function(){
        $center.animate(
            {scrollTop: $("#app_anchor",$event_info).offset().top}, 'slow');
        return false;
    });

    // Remove event, ask for confirmation
    $('button#remove_event',$event_info).click(function(){
        var id = $event_info.attr('event_id');
        var html = '<div title="Delete event?">\
<p><span class="ui-icon ui-icon-alert" style="float:left; margin:0 7px 20px 0;">\
</span>All information related to this event will be deleted. Are you sure?</p></div>';
        $(html).dialog({
            resizable: false,
            height:140,
            modal: true,
            buttons: {
                Yes: function() {
                    Event.actions.del(id,Event.callbacks.del);
                    $(this).dialog("close");
                },
                Cancel: function() {
                    $(this).dialog("close");
                }
            }
        });
        return false;
    });

    $('button#edit_event_b', $event_info).click(function(){
        showView('#edit_event', true, $event_info.attr('event_id'));
        return false;
    });

    // See applications for this event
    $('button#list_event_applications', $event_info).click(function(){
        var id = $event_info.attr('event_id');
        var name = $event_info.attr('event_name');
        // Update the title of the view
        $('h3#event_applications_title').text('Applications for "'+
                                              name+'"');
        showView('#event_applications', true);
        EventApplicationPool.actions.get(id,EventApplicationPool.callbacks.get);
        return false;
    });

    $('form',$event_create).submit(Event.onSubmitCreate);
    $('form#event_edit',$event_edit).submit(Event.onSubmitEdit);

    $('button#apply_changes_b', $event_edit).click(function(){
        $('form#event_edit',$event_edit).trigger('submit');
    });

    $dt_events = $('table#dt_events', $events).dataTable({
        'bJQueryUI' : true,
        'bAutoWidth' : false,
        "sDom": '<"H"lTfr>t<"F"ip>',
        "oTableTools": {
            "aButtons": [
                {
                    "sExtends":    "collection",
                    "sButtonText": "Export to",
                    "aButtons":    [ { "sExtends" : "csv",
                                       "sTitle" : "events"
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
                'mDataProp': 'name',
                'bSearchable' : true,
                'bVisible' : true
            },
            {
                'mDataProp': 'admin_id',
                'bSearchable' : true,
                'bVisible' : false
            },
            {
                'mDataProp': 'admin_username',
                'bSearchable' : true,
                'bVisible' : false
            },
            {
                'mDataProp': 'leaders',
                'bSearchable' : true,
                'bVisible' : false
            },
            {
                'mDataProp': 'organizer',
                'bSearchable' : true,
                'bVisible' : false
            },
            {
                'mDataProp': 'organizer_web',
                'bSearchable' : true,
                'bVisible' : false
            },
            {
                'mDataProp': 'organizer_telephone',
                'bSearchable' : true,
                'bVisible' : false
            },
            {
                'mDataProp': 'organizer_email',
                'bSearchable' : true,
                'bVisible' : false
            },
            {
                'mDataProp': 'venue',
                'bSearchable' : true,
                'bVisible' : false
            },
            {
                'mDataProp': 'town',
                'bSearchable' : true,
                'bVisible' : false
            },
                {
                'mDataProp': 'country',
                'bSearchable' : true,
                'sWidth' : '250px',
                'bVisible' : true
            },
            {
                'mDataProp': 'date_start',
                'bSearchable' : true,
                'bVisible' : true,
                'fnRender' : function(o,val){
                    return Yeapsy.helper.date(val);
                },
                'sWidth' : '110px'
            },
            {
                'mDataProp': 'date_end',
                'bSearchable' : true,
                'bVisible' : true,
                'fnRender' : function(o,val){
                    return Yeapsy.helper.date(val);
                },
                'sWidth' : '110px'
            },
            {
                'mDataProp': 'app_deadline',
                'bSearchable' : true,
                'bVisible' : true,
                'fnRender' : function(o,val){
                    return Yeapsy.helper.date(val);
                },
                'sWidth' : '110px'
            },
            {
                'mDataProp': 'n_participants',
                'bSearchable' : true,
                'bVisible' : false,
                'sWidth' : '100px'
            },
            {
                'mDataProp': 'n_leaders',
                'bSearchable' : true,
                'bVisible' : false,
                'sWidth' : '100px'
            },
            {
                'mDataProp': 'app_description',
                'bSearchable' : true,
                'bVisible' : false
            },
            {
                'mDataProp': 'description',
                'bSearchable' : true,
                'bVisible' : false
            },
            {
                'mDataProp': 'state',
                'bSearchable' : true,
                'bVisible' : true,
                'sWidth'   : '250px',
                'fnRender' : function(o,val){
                    return Event.state_str(val);
                }
            }
        ],
        'aoColumnDefs' : [
            {
                "sDefaultContent": "None",
                "aTargets": [ -1 ]
            }
        ]
    });

    $('tbody tr', $dt_events).live("click",function(){
        var json = $dt_events.fnGetData(this);
        if (!json) return false;
        Event.callbacks.getEvent(json);
        Event.callbacks.getEventEdit(json);
        showView('#event_info', true, json['id']);
        return false;
    });
});
