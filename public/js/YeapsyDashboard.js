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

//Dashboard view

//Cleanup personal information from dashboard
function dashboardCleanup(){
    $('span', $dashboard).empty();
};

$(document).ready(function(){
    $.getJSON('https://api.twitter.com/1/statuses/user_timeline.json?callback=?&include_entities=false&include_rts=false&screen_name=yeapsy&count=3',
              function(statuses){
                  var tw = $('ul#tweets', $dashboard);
                  tw.empty();
                  for (var i=0; i< statuses.length; i++){
                      var st = statuses[i]
                      tw.append('<li>- <i>'+ 
                                Yeapsy.helper.parseTwitterDate(st.created_at)
                                + '</i>: ' + st.text + '</li>');
                  }
              });
});