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

# Model class for applications
class Application < Sequel::Model
    # Many applications can be in 1 event
    many_to_one :event, :key => :event_id
    # Many applications can belong to 1 user
    many_to_one :user, :key => :applicant_id
    # 1 application has many evaluations
    one_to_many :evaluations, :key => :application_id

    plugin :validation_helpers
    plugin :association_dependencies, :evaluations => :destroy
    plugin :json_serializer

    def validate
        super
        validates_presence [:event_id, :event_name, :applicant_id,
                            :applicant_username, :state, :app_time]
        validates_unique([:event_id, :applicant_id],
                         :message => 'already present. Only one application can be submitted for each event')

        errors.add(:state, 'is not valid') if state && !(state >=0 && state<=4)
    end
end
