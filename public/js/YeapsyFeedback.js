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


var $feedback;

// Send feedback
$(document).ready(function(){
    // Post feedback and inform user
    $feedback.submit(function(){
        var data = Yeapsy.helper.serializeForm(this);
        Yeapsy.request.post('feedback',
                            function(){
                                $('textarea',$feedback).val('');
                                Yeapsy.helper.popMessage('Feedback sent',
                                                         'Thanks a lot for your comments');
                                showView('#dashboard');
                            },
                            data);
        return false;
    });
});