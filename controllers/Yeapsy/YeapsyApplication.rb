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

module YeapsyApplication

    APP_ST = {
        :pending => 0,
        :accepted => 1,
        :rejected => 2,
        :waiting_list => 3,
        :other => 4
    }

    APP_ST_INV = [:pending, :accepted, :rejected, :waiting_list, :other]

    private

    # Returns a list of all the applications of current user
    def list_applications
        apps = []
        begin
            return [200,
                    Application.filter(:applicant_id => @user_id).all.to_json]
        rescue => e
            return YeapsyError.new('Error listing applications',
                                   e.message,500).to_json
        end
    end


    # Create a new application
    def create_application(info)
        info_hash = Yeapsy.parse_json(info)
        if Yeapsy.is_error?(info_hash)
            return info_hash.to_json
        end


        begin
            #check that desired event exists and is open for apps
            event = Event[info_hash[:event_id]]
            return YeapsyError.nonexistent('event').to_json if !event

            if  ![YeapsyEvent::EVENT_ST[:call_leaders],
                  YeapsyEvent::EVENT_ST[:open]].include?(event.state)
                return YeapsyError.new("Error creating application",
                                       "This event does not accept applications",
                                       403).to_json
            end

            fields = [:application_data, :event_id, :event_name,
                      :applicant_id, :applicant_name, :applicant_username,
                      :app_time, :state]

            # Important, this application is from logged in user
            info_hash[:applicant_id] = @user_id
            info_hash[:applicant_username] = User[@user_id].username
            info_hash[:event_name] = event.name
            info_hash[:app_time] = Time.now
            info_hash[:state] = APP_ST[:pending]

            app = Application.new
            app.update_fields(info_hash, fields, {:missing => :skip})

            # Send email
            @mail.send(nil, User[@user_id].email,
                       "Application to #{event.name} received",
                       YeapsyMail.application_received(event.name))
                       

            [200, app.to_json]
        rescue Sequel::Error => e
            return YeapsyError.new("Error creating application",
                                   e.message,
                                   403).to_json
        rescue => e
            return YeapsyError.new("Error inserting new application",
                                   e.message, 500).to_json
        end
    end

    def get_application(id)
        # Only show my applications
        app = Application[id]
        return YeapsyError.nonexistent('application').to_json if !app

        if @user_id != app.applicant_id
            return YeapsyError.forbidden('get application').to_json
        end

        begin
            return [200, app.to_json]
        rescue => e
            return YeapsyError.new("Error getting application", e.message,
                                   500).to_json
        end
    end

    # DISABLED, USERS CANNOT MODIFY THEIR APPS, ONLY DELETE.
    # def modify_application(id, info)
    #     #only admins can modify applications and only to
    #     #change state
    #     info_hash = Yeapsy.parse_json(info)
    #     if Yeapsy.is_error?(info_hash)
    #         return info_hash.to_json
    #     end

    #     begin
    #         app = Application[id]
    #         return YeapsyError.nonexistent('application').to_json if !app

    #         event = Event[app.event_id]
    #         return YeapsyError.nonexistent('event').to_json if !event

    #         leaders = event.leaders.split(',');

    #         if event.admin_id != @user_id
    #             return YeapsyError.forbidden('modify application').to_json
    #         end

    #         fields = [:state]
    #         app.update_fields(info_hash, fields, {:missing => :skip})
    #         return [200, app.to_json]
    #     rescue => e
    #         return YeapsyError.new("Error updating application",
    #                                e.message, 500).to_json
    #     end
    # end

    # Delete an application
    # Event administrators can delete applications from an event
    def delete_application(id)
        begin
            app = Application[id]
            return YeapsyError.nonexistent('app').to_json if !app
            event = Event[app.event_id]
            return YeapsyError.nonexistent('event').to_json if !event

            if @user_rank != :superadmin &&
                    app.applicant_id != @user_id &&
                    event.admin_id != @user_id
                return YeapsyError.forbidden('delete application').to_json
            end

            app = app.destroy
            return [200, app.to_json]
        rescue => e
            return YeapsyError.new("Error deleting application",
                                   e.message, 500).to_json
        end
    end
end
