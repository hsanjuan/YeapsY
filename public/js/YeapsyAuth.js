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

// Handles everything related to user logins/logout
// and what happens before/after it
var YeapsyAuth = {
    actions : {
        credentials: function(){
            // Obtain credentials
            $.ajax({
                url: 'credentials',
                type: 'GET',
                dataType: 'json',
                success: YeapsyAuth.callbacks.login,
                error: function(err){
                    // If we are not authenticated
                    // Show login and login form
                    // Close any panels and hide session timout
                    showView('#login', false, false);
                    $('form#login_form',$login).fadeIn();
                    $layout.close('north');
                    $layout.close('west');
                    $('#countdown_p', $south).hide();
                }
            });
        },
        login: function(credentials){
            // Perform login with given user/pw credentials
            $.ajax({
                url: 'login',
                type: 'POST',
                dataType: 'json',
                data: credentials,
                success: YeapsyAuth.callbacks.login,
                error: function(err){
                    Yeapsy.helper.onError(err.responseText);
                }
            });
        },
        logout: function(){
            $.ajax({
                url: 'logout',
                type: 'POST',
                success: YeapsyAuth.callbacks.logout,
                error: function(err){

                }
            });
        },
        reminder: function(data){
            // Until request comes back, sets mouse pointer on wait mode
            $.ajax({
                url: 'reminder',
                type: 'POST',
                dataType: 'json',
                data: JSON.stringify(data),
                success: YeapsyAuth.callbacks.reminder,
                error: function(err){
                    if (error.status === 204) {
                        YeapsyAuth.callbacks.reminder()
                    }
                    else {
                        Yeapsy.helper.onError(err.responseText);
                    }
                },
                beforeSend: Yeapsy.helper.waitOn,
                complete: Yeapsy.helper.waitOff
            });
        }
    },
    callbacks : {
        login: function(response){
            // Response contains the credentials
            username = response.username
            user_id = response.user_id
            rank = response.rank
            email = response.email

            //Set user info in several parts of the interface

            // Top-right user button with picture
            var welcome = Yeapsy.helper.avatar(email, 15,
              'vertical-align:middle;margin-right:9px;border:0')+username;
            $('#top_link_user', $north).html(welcome);

            $('td#feedback_username', $feedback).text(username);

            // Show countdown, hide errors, hide admins stuff
            $('#countdown_p', $south).show();
            $('div#errors,div#messages').empty().hide();
            $('.superadmin,.admin').hide();

            // Show admin things depending on rank
            switch (rank){
            case 0:
                $('.superadmin, .admin').show();
                break;
            case 1:
                $('.admin').show();
                break;
            };

            // Interface is ready now. Hide and empty login form
            $('form#login_form',$login).fadeOut('fast',function(){
                $('form#login_form input',$login).val('');

                // Open top
                $layout.open('north');
                //$layout.open('west');
                $layout.close('east');

                // Shows dashboard if no hash defined
                Yeapsy.helper.showCurrentHash();
            });


            // Fetch our resources
            UserPool.actions.get(UserPool.callbacks.get);
            EventPool.actions.get(EventPool.callbacks.get);
            ApplicationPool.actions.get(ApplicationPool.callbacks.get);

            // Clean up login
            YeapsyAuth.cleanup();


        },
        logout: function(response){
            // Logout callback
            $('div#errors,div#messages').empty().hide();
            $('#countdown_p', $south).hide();

            //dismantle logout timeout
            clearInterval(clockInterval);


            $layout.close('north');
            //$layout.close('west');
            $layout.close('east');
            $('form',$login).hide();
            showView('#login');
            $('form#login_form',$login).fadeIn();


            // Cleanup information that had been filled in in the DOM
            User.cleanup();
            Event.cleanup();
            Application.cleanup();
            EventApplication.cleanup();
            dashboardCleanup();
            $('#top_link_user',$north).empty();
        },
        reminder: function(){
            // Reminder callback
            Yeapsy.helper.popMessage('Password resetted',
                                     'Check your inbox for new login credentials');
            $('form',$login).hide();
            $('form#reminder_form input',$login).val('');
            $('form#login_form',$login).fadeIn();
        }
    },
    cleanup: function(){
        $('form#reminder_form input',$login).val('');
        $('form#user_register input',$login).val('');
        $('form#login_form input',$login).val('');
    }
};

$(document).ready(function(){


    // Listeners for events related to auth/login
    $('form#login_form',$login).submit(function(){
        var data = Yeapsy.helper.serializeForm(this);
        YeapsyAuth.actions.login(data);
        return false;
    });

    $('form#reminder_form',$login).submit(function(){
        var data = Yeapsy.helper.serializeForm(this);
        YeapsyAuth.actions.reminder(data);
        return false;
    });

    $('#top_links a#logout',$north).click(function(){
        YeapsyAuth.actions.logout();
        return false;
    });

    $('a#forgot_pw',$login).click(function(){
        $('form',$login).hide();
        $('form#reminder_form',$login).fadeIn();
        return false;
    });

    $('.back_login',$login).click(function(){
        $('form',$login).hide();
        $('form#login_form',$login).fadeIn();
        $('form#reminder_form input',$login).val('');
        $('form#user_register input',$login).val('');
        return false;
    });

    $('button#register', $login).click(function(){
        // Generate new random numbers when clicking on register
        var number1 = Yeapsy.helper.randomLoginNumber();
        var number2 = Yeapsy.helper.randomLoginNumber();
        $('#number1', $user_register).text(number1);
        $('input[name="number1"]', $user_register).val(number1);
        $('#number2',$user_register).text(number2);
        $('input[name="number2"]', $user_register).val(number2);

        var username = $('input[name="username"]',$login).val();
        if (username.indexOf('@') >= 0)
            $('input[name="email"]', $user_register).val(username);
        else
            $('input[name="username"]', $user_register).val(username);
        $('input[name="password"]', $user_register).val($('input[name="password"]',$login).val());

        $('form',$login).hide();
        $user_register.fadeIn();
        return false;
    });

    showView('#login', false, false);
    YeapsyAuth.actions.credentials();
});
