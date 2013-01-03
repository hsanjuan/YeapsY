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

// Declaration of the global variables of Yeapsy which are not
// Yeapsy pools or resources

// Also set of all those refering to location in the DOM

// Layout
var $layout;
var $north;
var $west;
var $east;
var $south;
var $center;

var _ignoreHashChange = false;

// Login
var $login;
var username;
var user_id;
var rank;
var email;
var clockInterval;
var LOGOUT_TIMEOUT = 60;

// Dashboard
var $dashboard;

// Users
var $users;
var $user_profile;
var $user_edit_profile;
var $user_create;
var $user_register;
var $user_info;
var $dt_users;


// Applications
var $applications;
var $application_info;
var $dt_applications;

// Events
var $events;
var $event_create;
var $event_info;
var $event_edit;
var $dt_events;

// Event applications
var $dt_event_applications;
var $event_applications;
var $event_application_info;

// Feedback

var $feedback;

// Set all the DOM dependant variables
$(document).ready(function(){
    $north = $('body > div#north');
    $west = $('body > div#west');
    $east = $('body > div#east');
    $south = $('body > div#south');
    $center = $('body > div#center');

    $login = $('div#login',$center);

    $dashboard = $('div#dashboard', $center);

    $users = $('div#users',$center);
    $user_profile = $('div#my_profile',$center);
    $user_edit_profile = $('div#profile_edit',$center);
    $user_create = $('form#user_create',$east);
    $user_register = $('form#user_register',$login);
    $user_info = $('div#user_info',$east);

    $applications = $('div#applications',$center);
    $application_info = $('div#application_info',$center);

    $events = $('div#events',$center);
    $event_create = $('div#event_create',$center);
    $event_info = $('div#event_info',$center);
    $event_edit = $('div#edit_event',$center);

    $event_applications = $('div#event_applications', $center);
    $event_application_info = $('div#event_application_info', $center);

    $feedback = $('form#feedback', $center);
});
