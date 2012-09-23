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

// Javascript related to management of the users view

// User pool
var UserPool = {
    resource : "user",
    actions : {
        get : function(callback){
            Yeapsy.request.getPool(UserPool.resource,
                                    callback)
        },
        del : function(callback){
            // Call delete action for selected rows
            var sel = Yeapsy.dt.selectedRows($dt_users);
            for (var i=0; i < sel.length; i++){
                var id = $dt_users.fnGetData(sel[i]).id;
                User.actions.del(id,callback);
            };
        }
    },

    callbacks : {
        get : function(pool_json){
            // Receive the list of users. It should contain at least myself.
            Yeapsy.dt.multiInsert($dt_users, pool_json);

            // Extract current user information. If no name is set,
            // show reminder to fill in profile
            var json = Yeapsy.dt.getData($dt_users,user_id);
            if (!json['name'])
                setTimeout(function(){
                    Yeapsy.helper.popMessage('Your profile seems uncomplete','Remember to fill in your profile information if you want to apply to an event. Uncomplete profiles are unlikely to get selected.');
                },1500);

            // Fill in profile with current information
            User.callbacks.getProfile(json);
        }
    }
};

// User management code
var User = {
    resource : "user",
    actions : {
        get : function(id, callback) {
            Yeapsy.request.get(User.resource,
                               callback,
                               id);
        },

        post : function(data, callback) {
            Yeapsy.request.post(User.resource,
                                callback,
                                data);
        },

        register : function(data, callback) {
            Yeapsy.request.post('register',
                                callback,
                                data);
        },

        put : function(id, data, callback){
            Yeapsy.request.put(User.resource,
                                callback,
                                id, data);
        },

        del : function(id, callback){
            Yeapsy.request.del(User.resource,
                                callback,
                                id);
        }
    },
    callbacks : {
        getToEastPane : function(json){
            // Fill in user information to the east panel
            // Used by admins
            $('table#user_info_table',$user_info).html(
                User.profile_table_trs(json));
        },

        getProfile : function(json){
            // Call back to get users own profile.
            // Generate and insert information table
            $('table#profile',$user_profile).html(User.profile_table_trs(json));

            //Update dashboard information
            $('.username', $dashboard).text(json['username']);

            var name = json['name'];

            // Place first name, email and country in dashboard
            if (name){
                name = name.split(' ')[0];
                $('.name', $dashboard).text(' '+name);
            }
            $('.email', $dashboard).text(json['email']);
            $('.country', $dashboard).text(json['country']);

            // Place avatar in dashboard
            var avatar = Yeapsy.helper.avatar(json['email'],100);
            $('.user_img', $dashboard).html(avatar);
        },

        getProfileEdit : function(json){
            // Call back to edit user profile
            // Insert profile information in the edit table
            var table = $('table#user_edit_table', $user_edit_profile);
            table.html(User.profile_edit_trs(json));

            // Fix country select, enable datepicker for dates
            var country = json['country'];
            if (country)
                $('#countries option[value="'+country+'"]',
                  table).attr('selected','selected');
            $('input[name=birth_date]',table).datepicker({
                changeYear: true,
                changeMonth: true,
                yearRange: '-100:+0',
                dateFormat: 'dd-mm-yy'
            });

            // Remove anything that remined in password fields
            $('input[name=password],input[name=old_password],input[name=confirm_password]').val('');
        },

        post : function(json){
            // Insert new user in table
            Yeapsy.dt.insert($dt_users,json);
            Yeapsy.helper.popMessage("Success","user created");
            $layout.close('east');
        },

        register : function(json){
            // Call back for new user registration
            Yeapsy.helper.popMessage('Success','user registered');
            $layout.close('east');

            // Extract specified username and password
            var form = $user_register;
            var username = $('input[name="username"]', form).val();
            var pw = $('input[name="password"]', form).val();

            // Remove values from those fields
            $('input', form).val('');
            $('input[name="agree"]', form).removeAttr('checked');

            // Fill in login and submit the login for autologin
            var login = $('form#login_form', $center);
            $('input#username', login).val(username);
            $('input#password', login).val(pw);
            login.trigger('submit');
        },

        put : function(json){
            // Profile modification callback
            // Update the datatable
            Yeapsy.dt.update($dt_users,json);

            // Extract updated row and fill in profile
            // (extract from dt so it is no raw)
            var new_json = Yeapsy.dt.getData($dt_users,json['id']);
            User.callbacks.getProfile(new_json);

            Yeapsy.helper.popMessage('Success',
                                     'User profile updated correctly');
            // Switch back to profile view
            showView('#my_profile');
        },

        update : function(json){
            // Update any user callback. Used only to update rank now.
            Yeapsy.dt.update($dt_users,json);
            Yeapsy.helper.popMessage('Success',
                                     'User rank updated correctly');
        },

        del : function(json){
            // Remove logged in user callback
            Yeapsy.helper.popMessage("Success","user deleted from the system");
            YeapsyAuth.callbacks.logout();
        },
        delRow : function(json){
            // Remove any user callback (admin does this)
            Yeapsy.helper.popMessage("Success","user deleted from the system");
            Yeapsy.dt.del($dt_users,json)
        }
    },
    rank_str : function(index) {
        // Returns the rank name given the index
        if (index == null) return "";
        return ["Superadmin",
                "Admin",
                "User"][index];
    },
    action_icons : function(json, user_id){
        //build action icons for this user
        return "";
    },
    profile_table_trs : function(json){
        // Return the rows for the table of the profile
        json = Yeapsy.helper.sanitizeJSON(json);
        var avatar = Yeapsy.helper.avatar(json['email'], null, 'float:right;');
        var html = '\
  <tr>\
     <td class="label_column">Profile picture</td>\
     <td>\
        '+avatar+'\
     </td>\
  </tr>\
  <tr>\
    <td class="label_column">Registration date</td>\
    <td>'+json["reg_date"]+'</td>\
  </tr>\
  <tr>\
    <td class="label_column">Username / ID</td>\
    <td>'+json["username"]+' / '+json['id']+'</td>\
  </tr>\
  <tr>\
    <td class="label_column">Full Name</td>\
    <td>'+json["name"]+'</td>\
  </tr>\
  <tr>\
    <td class="label_column">Email</td>\
    <td>'+json["email"]+'</td>\
  </tr>\
  <tr>\
    <td class="label_column">Rank</td>\
    <td>'+json["rank"]+'</td>\
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
  </tr>';
        return html;
    },
    profile_edit_trs : function(json) {
        // Return the rows of the profile edit table
        json = Yeapsy.helper.sanitizeJSON(json);
        var html = '\
  <tr>\
    <td class="label"><label>Full Name</label></td>\
    <td><input type="hidden" name="id" value="'+json['id']+'"/>\
    <input type="text" name="name" value="'+json['name']+'"/></td>\
  </tr>\
  <tr>\
    <td class="label"><label>Email</label></td>\
    <td><input type="text" name="email" value="'+json['email']+'" /></td>\
  </tr>\
  <tr>\
    <td class="label"><label>Birth date</label></td>\
    <td><input type="text" name="birth_date" value="'+json["birth_date"]+'" />\
    <div class="tip">dd-mm-yyyy</div>\
    </td>\
  </tr>\
  <tr>\
    <td class="label"><label>Birth place</label></td>\
    <td><input type="text" name="birth_place" value="'+json['birth_place']+'" /></td>\
  </tr>\
  <tr>\
    <td class="label"><label>Gender</label></td>\
    <td>\
       <select type="text" name="gender">\
          <option value="" '+(json['gender'] == '' ? 'selected="selected"' : '')+'>Not specified</option>\
          <option value="female" '+(json['gender'] == 'female' ? 'selected="selected"' : '')+'>Female</option>\
          <option value="other" '+(json['gender'] == 'other' ? 'selected="selected"' : '')+'>Other</option>\
          <option value="male" '+(json['gender'] == 'male' ? 'selected="selected"' : '')+'>Male</option>\
       </select>\
   </td>\
  </tr>\
  <tr>\
    <td class="label"><label>Nationality</label></td>\
    <td><input type="text" name="nationality" value="'+json['nationality']+'" /></td>\
  </tr>\
  <tr>\
    <td class="label"><label>Passport number</label></td>\
    <td><input type="text" name="passport" value="'+json['passport']+'" /></td>\
  </tr>\
  <tr>\
    <td><label>Full address</label></td>\
    <td><textarea name="address" style="height:4em;">'+json['address']+'</textarea>\
    <div class="tip">Do not forget to include postal code and town here</div>\
    </td>\
  </tr>\
  <tr>\
    <td class="label"><label>Country</label></td>\
    <td><select name="country" id="countries">'+Yeapsy.helper.countryOptions()+'</select></td>\
  </tr>\
  <tr>\
    <td class="label"><label>Telephone</label></td>\
    <td><input type="text" name="telephone" value="'+json['telephone']+'" /></td>\
  </tr>\
  <tr>\
    <td class="label"><label>Organization</label></td>\
    <td><input type="text" name="organization" value="'+json['organization']+'" /></td>\
  </tr>\
  <tr>\
    <td class="label"><label>About/Public</label></td>\
    <td><textarea name="about_public">'+json['about_public']+'</textarea>\
    <div class="tip">This information will be visible to other participants of events</div>\
    </td>\
  </tr>\
  <tr>\
    <td class="label"><label>About/Private</label></td>\
    <td><textarea name="about_private">'+json['about_private']+'</textarea>\
    <p class="tip">This information will only be visible to leaders of events</p>\
    </td>\
  </tr>\
';
        return html;
    },
    onSubmitCreate : function(){
        // User creation event
        var data = Yeapsy.helper.serializeForm(this);
        User.actions.post(data,User.callbacks.post);
        return false;
    },
    onSubmitRegister : function(){
        // User registration event. Perform necessary checks
        var username =  $('input[name="username"]',this).val();
        var pass = $('input[name="password"]',this).val();
        var confirm = $('input[name="confirm"]',this).val();
        var email =  $('input[name="email"]',this).val();
        var agree = $('input[name="agree"]',this).is(':checked');
        var n1 =  parseInt($('span#number1',this).text(),10);
        var n2 =  parseInt($('span#number2',this).text(),10);
        var n = parseInt($('input[name="test"]',this).val());

        if (pass.length < 5 || pass != confirm) {
            Yeapsy.helper.popError('Password mismatch or problem',
                                   'Please check that your password input was correct and that it has at least 5 characters.');
            return false;
        };

        if (!agree) {
            Yeapsy.helper.popError('Error',
                                   'Sorry but you must agree with ToS and Privacy Policy');
            return false;
        };

        if (n != n1 + n2){
            Yeapsy.helper.popError('Human check failed',
                                   'Try adding better!');
            // Reset this numbers
            n1 = Yeapsy.helper.randomLoginNumber()
            n2 = Yeapsy.helper.randomLoginNumber()
            $('#number1',this).text(n1);
            $('input[name="number1"]',this).val(n1);
            $('#number2', this).text(n2);
            $('input[name="number2"]', this).val(n2);
            return false;
        }

        $('input[name="number1"]',this).val(n1);
        $('input[name="number2"]',this).val(n2);

        var data = Yeapsy.helper.serializeForm(this);
        User.actions.register(data,User.callbacks.register);
        return false;
    },


    onSubmitEdit : function(){
        // User edit event
        var id = $('input[name="id"]',this).val();
        var pass = $('input[name="password"]',this).val();
        var confirm = $('input[name="confirm_password"]',this).val();
        var old = $('input[name="old_password"]',this).val();

        if ((pass || confirm) && (pass!= confirm)){
            Yeapsy.helper.popError('Error',
                                   'New password does not match confirmation');
            return false;
        };

        var data = Yeapsy.helper.serializeForm(this);
        // Delete pw data if no password has been specified
        if (!pass) {
            delete data['password'];
            delete data['new_password'];
            delete data['old_password'];
        };
        User.actions.put(id,data,User.callbacks.put);
        return false;
    },
    onSubmitUpdate : function(){
        // User update (made by admin)
        var id = $('input[name="id"]',this).val();
        var data = Yeapsy.helper.serializeForm(this);
        User.actions.put(id,data,User.callbacks.update);
        return false;
    },
    cleanup : function(){
        // Empties user related tables
        $dt_users.fnClearTable();
        var empty = {};
        User.callbacks.getToEastPane(empty);
        User.callbacks.getProfile(empty);
        User.callbacks.getProfileEdit(empty);
    }
};


$(document).ready(function(){
    // Admin panel new user button
    $('button#new_user', $users).click(function(){
        showEastView('#user_create');
        return false;
    });

    // Admin panel delete user button
    $('button#delete_user', $users).click(function(){
        UserPool.actions.del(User.callbacks.delRow);
        return false;
    });

    // Delete profile, popup confirmation
    $('button#remove_profile',$user_profile).click(function(){
        var html = '<div title="Delete profile?">\
<p><span class="ui-icon ui-icon-alert" style="float:left; margin:0 7px 20px 0;">\
</span>Are you sure that you want to permanently delete your profile?</p></div>';
        $(html).dialog({
            resizable: false,
            height:140,
            modal: true,
            buttons: {
                Yes: function() {
                    User.actions.del(user_id,User.callbacks.del);
                    $( this ).dialog( "close" );
                },
                Cancel: function() {
                    $( this ).dialog( "close" );
                }
            }
        });
        return false;
    });

    // Edit profile. Extract data from dt and place it in the edit view
    $('button#edit_profile',$user_profile).click(function(){
        var json = Yeapsy.dt.getData($dt_users,user_id);
        User.callbacks.getProfileEdit(json);
        showView('#profile_edit',true);
        return false;
    });

    // Register some more listeners
    $user_create.submit(User.onSubmitCreate);
    $user_register.submit(User.onSubmitRegister);
    $('form#user_edit',$user_edit_profile).submit(User.onSubmitEdit);
    $('form#user_update',$user_info).submit(User.onSubmitUpdate);

    $('button#edit_profile_b',$user_edit_profile).click(function(){
        $('form#user_edit',$user_edit_profile).trigger('submit');
    });

    $dt_users = $('table#dt_users',$users).dataTable({
        'bJQueryUI' : true,
        'bAutoWidth': false,
        "sDom": '<"H"lTfr>t<"F"ip>',
        "oTableTools": {
            "aButtons": [
                {
                    "sExtends":    "collection",
                    "sButtonText": "Export to",
                    "aButtons":    [ { "sExtends" : "csv",
                                       "sTitle" : "users"
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
                'bVisible' : true
            },
            {/* Name */
                'mDataProp': 'name',
                'bSearchable' : true,
                'bVisible' : true
            },
            {/* Rank */
                'mDataProp': 'rank',
                'bSearchable' : true,
                'bVisible' : true,
                'fnRender' : function(o,val){
                    return User.rank_str(val);
                }
            },
            {/* Bdate */
                'mDataProp': 'birth_date',
                'bSearchable' : true,
                'bVisible' : false,
                'fnRender' : function(o,val){
                    return Yeapsy.helper.date(val);
                }
            },
            {/* Bplace */
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
                'mDataProp': 'last_login',
                'bSearchable' : true,
                'bVisible' : true
            },
            {
                'mDataProp': 'reg_date',
                'bSearchable' : true,
                'bVisible' : false
            },
            {
                'mDataProp': 'enabled',
                'bSearchable' : true,
                'bVisible' : false
            }
        ],
        'aoColumnDefs' : [
            {
                "sDefaultContent": "None",
                "aTargets": [ -1 ]
            }
        ]
    });

    // Open east pane when admin dbclicks on user
    $('tbody tr', $dt_users).live("dblclick",function(){
        var json = $dt_users.fnGetData(this);
        if (!json) return false;
        $('input[name="id"]',$user_info).val(json['id']);
        User.callbacks.getToEastPane(json)
        showEastView('#user_info');
        return false;
    });

    // Toggle column color
    $('tbody tr', $dt_users).live("click", function() {
        $(this).toggleClass('row_selected');
    });
});