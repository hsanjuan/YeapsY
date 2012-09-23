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

# Yeapsy user model
class User < Sequel::Model
    # One user can administer many events
    one_to_many :events, :key => :admin_id
    # One user can apply many times
    one_to_many :applications, :key => :applicant_id
    # One user can evaluate many evaluations
    one_to_many :evaluations, :key => :author_id

    plugin :validation_helpers
    plugin :association_dependencies, :events => :nullify, #nullify events
                                  :applications => :destroy, #destroy my apps
                                  :evaluations => :destroy #destroy evals i did
    plugin :json_serializer

    def validate
        super
        validates_presence :username
        validates_min_length(5,:password) if new?
        validates_unique(:username, :email)

        errors.add(:email,
                   "seems not to be correct") if !Yeapsy.valid_email(email)

        invalid = username[/[^[:alnum:]_]+/]
        if username.length < 3 || username.length > 20 || invalid
            string = 'must be at least 3 characters, at most 20 '
            string << 'and contain only alphanumeric characters'
            errors.add(:username, string)
        end
    end

    # Setter for password, cook it before
    def password=(new_pw)
        new_pw = Yeapsy.cook(new_pw, @values[:id])
        super(new_pw)
    end

    # Check if user has applied for an event, or is leader for it
    def involved_in_event(event_id)
        applied = applications_dataset.first(:event_id => event_id) != nil
        leader = Event[event_id].leaders.split(',').include?(username)
        return applied || leader
    end
end
