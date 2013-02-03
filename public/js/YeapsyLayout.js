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

//Define the Yeapsy window layout

//Translation, not used
function _(str){
    return str;
};

// Switches to a new view
// Selects menu item if possible
// Option indicates whether to unselect current menu item
function showView(view, unselect_menu, set_hash){
    if (unselect_menu)
        $('.menu li',$north).removeClass("selected");
    $('.menu li#li_'+view.substring(1),$north).addClass("selected");
    $center.children().hide();
    $layout.close('east');
    $center.children(view).show();
    if (set_hash === false) return;
    if (set_hash === true || set_hash === undefined)
        Yeapsy.helper.setHash(view);
    else
        Yeapsy.helper.setHash(view + '+' + set_hash);

};

// Opens the east pane with the indicated view
function showEastView(view){
    $east.children().hide();
    $east.children(view).show();
    $layout.open('east');
};

// Toggles the openness of the east pane when opening a view
// which is open already
function toggleEastView(view){
    var now = '#' + $east.children(':visible').attr('id');
    if (now == view)
        $layout.toggle('east');
    else
        showEastView(view);
};

$(document).ready(function(){
    var east_size = Math.floor($center.width() * 0.3);
    if (east_size < 350) east_size = 350;

    $layout = $('body').layout({
        //enable showOverflow on west-pane so CSS
        //popups will overlap north pane
        fxName: false,
        west__showOverflowOnHover: true,
        closable : false,
        resizable : false,
        slidable : true,
        north__spacing_open : 0,
        north__spacing_closed : 0,
        north__size :53,
        north__initClosed : true,
        north__closable : true,
        west__spacing_open : 0,
        west__size : 100,
        west__minSize: 130,
        west__maxSize: 130,
        west__initClosed : true,
        west__spacing_closed: 0,
        west__closable : false,
        east__closable : true,
        east__initClosed : true,
        east__spacing_open : 5,
        east__spacing_closed : 0,
        east__size : east_size,
        east__resizable : true,
        south__spacing_open : 0
        //south__size : 40,
        //south__minSize: 200,
        //south__maxSize: 55,
    });

    $('div.view',$center).hide();


    // Listen to menu items click, and open the view
    $('.menu', $north).on("click", 'li', function(){
        var id = '#'+ $(this).attr("id").substring(3);

        $('li',$(this).parent()).removeClass("selected");

        $(this).addClass("selected");
        showView(id,false);
        return false;
    });
});
