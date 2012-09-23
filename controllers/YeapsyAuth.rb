# -*- coding: utf-8 -*-

###############################################################################
#     Copyright © 2012 Hector Sanjuan                                         #
#                                                                             #
#     This file is part of Yeapsy.                                            #
#                                                                             #
#     Yeapsy is free software: you can redistribute it and/or modify          #
#     it under the terms of the GNU General Public License as published by    #
#     the Free Software Foundation, either version 3 of the License, or       #
#     (at your option) any later version.                                     #
#                                                                             #
#     Yeapsy is distributed in the hope that it will be useful,               #
#     but WITHOUT ANY WARRANTY; without even the implied warranty of          #
#     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the           #
#     GNU General Public License for more details.                            #
#                                                                             #
#     You should have received a copy of the GNU General Public License       #
#     along with Yeapsy.  If not, see <http://www.gnu.org/licenses/>.         #
#                                                                             #
###############################################################################


# Handle authentication for Warden
class YeapsyAuth
    def self.authenticate(username, password)
        if username.include?('@')
            user = User[:email => username.downcase]
        else
            user = User[:username => username.downcase]
        end

        if user
            if !user.enabled then return nil end
            password = Yeapsy.cook(password,user.id)
            if user.password == password
                return {:id => user.id,
                    :username => user.username,
                    :rank => user.rank,
                    :email => user.email
                }
            end
        end
        nil
    end
end

class FailureApp
    def self.call(env)
        [401,{'Content-Type'  => 'application/json;charset=utf-8'},
         [{:title => 'Not authorized',
             :message => 'Not logged in'}.to_json]]
    end
end

# Authentication
Warden::Manager.serialize_into_session{|user| user[:id] }
Warden::Manager.serialize_from_session{|id| User[id] }

Warden::Strategies.add(:password) do
    def valid?
        params["username"] && params["password"]
    end

    def authenticate!
        u = YeapsyAuth.authenticate(params["username"],
                                    params["password"])
        u.nil? ? fail! : success!(u)
    end
end
