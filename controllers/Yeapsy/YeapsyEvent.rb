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

module YeapsyEvent
    EVENT_ST = {
        :disabled => 0,
        :call_leaders => 1,
        :preparation => 2,
        :open => 3,
        :ready => 4,
        :closed => 5
    }

    EVENT_ST_INV = [:disabled, :call_leaders, :preparation, :open, :ready,
                    :closed]

    private

    # List events. The output is different depeding on who the logged in user
    # is and how related to the event is
    def list_events
        events = []

        begin
            return [200, Event.all.to_json] if @user_rank == :superadmin

            #see events I administer
            events += User[@user_id].events_dataset.all

            #see events with open calls
            events += Event.filter(:state => [EVENT_ST[:call_leaders],
                                              EVENT_ST[:open]]).all

            #see events I have applied to which are not closed or disabled
            applied_to = User[@user_id].applications_dataset.map(:event_id)
            events += Event.filter(:id => applied_to,
                                   ~:state => [EVENT_ST[:disabled],
                                               EVENT_ST[:closed]]).all

            events += Event.filter(:leaders.like("%#{@username}%")).all
            events.uniq! #remove duplicates
            return [200, events.to_json]
        rescue => e
            return YeapsyError.new("Error listing events",e.message,500).to_json
        end
    end

    # Create a new event
    def create_event(info)
        #only admin or superadmins can create events
        if @user_rank != :admin && @user_rank != :superadmin
            return YeapsyError.forbidden('create events').to_json
        end

        info_hash = Yeapsy.parse_json(info)
        if Yeapsy.is_error?(info_hash)
            return info_hash.to_json
        end

        begin
            fields = [:admin_id, :admin_username, :name, :organizer, :venue,
                      :town, :country, :date_start, :date_end, :app_deadline,
                      :description, :app_description, :n_participants,
                      :n_leaders, :organizer_web, :organizer_telephone,
                      :organizer_email, :leaders]
            info_hash[:admin_id] = @user_id
            info_hash[:admin_username] = @username

            # Parse and sanitize leaders. They must be registered
            if info_hash[:leaders]
                leaders = info_hash[:leaders].delete(' ').split(',')
                leaders.collect! do |leader|
                    leader if User[:username => leader]
                end
                leaders.compact!
                leaders = leaders.join(',')
                info_hash[:leaders] = leaders
            end

            event = Event.new()
            event.update_fields(info_hash, fields, {:missing => :skip})
            [200, event.to_json]
        rescue Sequel::Error => e
            return YeapsyError.new("Error creating event",
                                   e.message,
                                   403).to_json
        rescue => e
            return YeapsyError.new("Error creating event",
                                   e.message, 500).to_json
        end
    end

    def get_event(id)
        #sucess when user is
        #superadmin
        #admin of the event
        #the event is open or calling for leaders
        #i am an applicant of the event

        begin
            event = Event[id]
            return YeapsyError.nonexistent('event').to_json if !event

            if @user_rank == :superadmin ||
                    event.state == EVENT_ST[:call_leaders] ||
                    event.state == EVENT_ST[:open] ||
                    event.admin_id == @user_id ||
                    User[@user_id].involved_in_event(id)
                return [200, event.to_json]
            else
                return YeapsyError.forbidden('see event').to_json;
            end
        rescue => e
            return YeapsyError.new("Error getting event",
                                   e.message, 500).to_json
        end
    end

    def modify_event(id, info)
        begin
            event = Event[id]
            return YeapsyError.nonexistent('event').to_json if !event

            if @user_rank != :superadmin && event.admin_id != @user_id
                return YeapsyError.forbidden('modify event').to_json
            end

            info_hash = Yeapsy.parse_json(info)
            if Yeapsy.is_error?(info_hash)
                return info_hash.to_json
            end

            fields = [:name, :organizer, :venue, :town,
                      :country, :date_start, :date_end, :app_deadline,
                      :description, :app_description, :n_participants,
                      :n_leaders, :state, :organizer_web, :organizer_telephone,
                      :organizer_email, :leaders]

            if info_hash[:leaders]
                leaders = info_hash[:leaders].delete(' ').split(',')
                leaders.collect! do |leader|
                    leader if User[:username => leader]
                end
                leaders.compact! #removes nil elems
                leaders = leaders.join(',')
                info_hash[:leaders] = leaders
            end

            event.update_fields(info_hash, fields, {:missing => :skip})
            return [200, event.to_json]
        rescue Sequel::Error => e
            return YeapsyError.new("Error modifying event",
                                   e.message,
                                   403).to_json
        rescue => e
            return YeapsyError.new("Error modifying event",
                                   e.message, 500).to_json
        end
    end

    def delete_event(id)
        begin
            event = Event[id]
            return YeapsyError.nonexistent('event').to_json if !event

            if @user_rank != :superadmin && event.admin_id != @user_id
                return YeapsyError.forbidden('delete event').to_json
            end

            event = event.destroy

            return 200, event.to_json
        rescue => e
            return YeapsyError.new("Error deleting event",
                                   e.message, 500).to_json
        end
    end

    # EVENT APPLICATIONS MANAGEMENT

    # Merges relevant user and application values
    # and returns the hash
    def prepare_app_info(app)

        user = User[app.applicant_id]
        if !user
            msg = 'User #{app.applicant_id} does not exist for app #{app.id}'
            raise msg
        end
        app_info = user.values

        #delete non necessary values
        app_info.delete(:password)
        app_info.delete(:last_login)
        app_info.delete(:registration_date)
        app_info.delete(:enabled)
        app_info.delete(:rank)

        #add information from the application
        app_info[:id] = app.id
        app_info[:application_data] = app.application_data
        app_info[:state] = app.state
        app_info[:app_time] = app.app_time
        app_info[:event_id] = app.event_id
        app_info[:archived] = app.archived

        #add information from the evaluation
        eval = app.evaluations_dataset.first(:author_id => @user_id)
        app_info[:evaluation_id] = eval ? eval.id : nil
        app_info[:mark] = eval ? eval.mark : nil
        app_info[:average] = app.evaluations_dataset.avg(:mark)

        return app_info
    end

    public

    # List of applications for certain event
    # Only superadmin, event admin or leaders can see this
    def get_event_applications(id)
        begin
            event = Event[id]
            return YeapsyError.nonexistent('event').to_json if !event

            leaders = event.leaders.split(',')
            admin_id = event.admin_id

            #only event admin and leaders can fetch this info
            if @user_rank != :superadmin && @user_id != admin_id &&
                    !leaders.include?(@username)
                return YeapsyError.forbidden('list event applications').to_json
            end

            # If not superadmin or admin, do not include archived apps
            if @user_rank != :superadmin && admin_id != @user_id
                apps = event.applications_dataset.exclude(:archived => true)
            else
                apps = event.applications
            end


            apps = apps.collect do |app|
                prepare_app_info(app)
            end

            return [200,apps.to_json]

        rescue => e
            return YeapsyError.new("Error getting applications for event",
                                   e.message, 500).to_json
        end
    end

    # Get a single application
    def get_event_application(event_id, app_id)
        begin

            event = Event[event_id]
            return YeapsyError.nonexistent('event').to_json if !event

            app = event.applications_dataset.first(:id => app_id)
            return YeapsyError.nonexistent('application').to_json if !app

            leaders = event.leaders.split(',')
            admin_id = event.admin_id

            #only event admin and leaders can fetch this info
            if @user_rank != :superadmin && @user_id != admin_id &&
                    !leaders.include?(@username)
                return YeapsyError.forbidden('get event application').to_json
            end

            #archived applications cannot be seen by leaders
            if @user_rank != :superadmin && admin_id != @user_id &&
               app.archived
                return YeapsyError.forbidden('see this application').to_json
            end

            app_info = prepare_app_info(app)

            return [200, app_info.to_json]
        rescue => e
            #warn e.backtrace
            return YeapsyError.new("Error getting application for event",
                                   e.message, 500).to_json
        end

    end

    # Only the state of an event application can be changed
    def modify_event_application(event_id, app_id, info)
        #only admins and leaders can modify application
        info_hash = Yeapsy.parse_json(info)
        if Yeapsy.is_error?(info_hash)
            return info_hash.to_json
        end

        begin
            app = Application[app_id]
            return YeapsyError.nonexistent('app').to_json if !app

            event = Event[event_id]
            return YeapsyError.nonexistent('event').to_json if !event

            user = User[app.applicant_id]
            return YeapsyError.nonexistent('user').to_json if !user

            leaders = event.leaders.split(',');

            if event_id != event.id
                return YeapsyError.forbidden('modify application for event').to_json
            end

            if @user_rank != :superadmin &&
               event.admin_id != @user_id &&
               !leaders.include?(@username)
                return YeapsyError.forbidden('modify application for event').to_json
            end

            fields = []
            fields << :state if info_hash[:state]

            state_old = YeapsyApplication::APP_ST_INV[app.state]

            # event administrators can edit this
            if !info_hash[:archived].nil?
                if event.admin_id == @user_id || @user_rank == :superadmin
                    fields << :archived
                else
                    return YeapsyError.forbidden('archive application').to_json
                end
            end

            # Commit to DB
            app.update_fields(info_hash, fields, {:missing => :skip})

            # Return the app info
            app_info = prepare_app_info(app)

            # Inform user the state of the application has changed
            state_str = YeapsyApplication::APP_ST_INV[app.state]
            if state_old != state_str
                @mail.send(nil,user.email,
                           "Yeapsy: the state of your application has changed",
                           YeapsyMail.application_state_change(event.name,
                                                               state_str))
            end

            return [200, app_info.to_json]
        rescue Sequel::Error => e
            return YeapsyError.new("Error updating application",
                                   e.message,
                                   403).to_json
        rescue => e
            return YeapsyError.new("Error updating application",
                                   e.message, 500).to_json
        end
    end

end
