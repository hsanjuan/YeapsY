# -*- coding: undecided -*-
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

# Model for evaluations
# Evaluations are linked to the application of
# a certain user for a certain event
class Evaluation < Sequel::Model
    # One event can have many evaluations
    many_to_one :event, :key => :event_id
    # One user can submit many evaluations
    many_to_one :user, :key => :author_id
    # One application can have many evaluations
    many_to_one :application, :key => :application_id

    plugin :validation_helpers
    plugin :json_serializer

    def validate
        super
        validates_unique([:event_id, :application_id, :author_id],
                         :message => 'already present. Only one evaluation per application and event is possible')

        validates_presence(:mark)

        errors.add(:mark, 'is not valid') if !(mark >= 0 && mark <= 100)
    end
end
