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

// Handle the submission of new ratings

var Evaluation = {
    resource: 'evaluation',
    actions : {
        post : function(data, callback){
            Yeapsy.request.post(Evaluation.resource,
                                callback,
                                data);
        },

        put : function(id, data, callback){
            Yeapsy.request.put(Evaluation.resource,
                               callback,
                               id, data);
        }
    },

    callbacks : {
        post : function(json){
            // When a new evaluation is submitted, the event application
            // is refetched. On callback, both the event table (put) and the
            // app information (which user is looking at) are refreshed
            var app_id = json['application_id'];
            var event_id = json['event_id'];
            var cb = function(json){
                EventApplication.callbacks.put(json);
                EventApplication.callbacks.getEventApplication(json);
            };
            EventApplication.actions.get(event_id,app_id,cb);

        },

        put : function(json){
            // Same as above
            Evaluation.callbacks.post(json);
        }
    }
};