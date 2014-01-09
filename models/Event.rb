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

# Model for events
class Event < Sequel::Model
    # Many events can be administered by one user
    many_to_one :user, :key => :admin_id
    # One event can have many applications
    one_to_many :applications, :key => :event_id
    # One event can have many evaluations
    one_to_many :evaluations, :key => :event_id

    plugin :validation_helpers
    plugin :association_dependencies, :applications => :destroy
    plugin :json_serializer

    def validate
        super
        validates_presence [:admin_id, :admin_username, :name, :organizer,
                            :organizer_email, :venue, :town, :country,
                            :date_start, :date_end]
        validates_unique :name

        errors.add(:state, 'is not valid') if state && !(state>=0 && state<=5)

        # Check that we have a valid start and end dates
        if date_start && !date_start.is_a?(Time)
            errors.add(:date_start, "format is incorrect")
        end

        if date_end && !date_end.is_a?(Time)
            errors.add(:date_end, "format is incorrect")
        end

        if app_deadline && !app_deadline.is_a?(Time)
            errors.add(:app_deadline, "format is incorrect")
        end
    end
end
