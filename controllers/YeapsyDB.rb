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

# This class defines the schemas of the DB and performs the connection
# to it
class YeapsyDB

    def initialize(config)
        @config = config
    end

    def connect
        case @config[:database_type]
        when 'sqlite'
            @db = Sequel.sqlite(@config[:database_sqlite_file])
        when 'mysql'
            db_host = @config[:database_host]
            db_user = @config[:database_user]
            db_name = @config[:database_name]
            db_pw = @config[:database_pw]
            @db = Sequel.mysql2(db_name, :user => db_user,
                                :host => db_host,
                                :password => db_pw);
        when 'url'
            @db = Sequel.connect(ENV['DATABASE_URL'])
        else
            raise 'Wrong database type'
        end

        # Perform setup of the DB we just connected to
        setup()
        return @db
    end

    private

    # Create the necessary tables in the DB if they are not created yet
    # This is where the schemas are set
    def setup
        @db.create_table? :users do
            primary_key :id
            String :username, :unique => true
            String :name
            String :password
            Integer :rank, :default => 2 #user
            Time :birth_date
            String :birth_place
            String :gender
            String :nationality
            String :email, :unique => true
            String :passport
            String :address
            String :country
            String :telephone
            #    String :iban
            #    String :bank_name
            #    String :bank_address
            String :organization
            String :about_public, :text => true
            String :about_private, :text => true
            Time :reg_date
            Time :last_login
            Boolean :enabled, :default => false
        end

        @db.create_table? :events do
            primary_key :id
            foreign_key :admin_id, :users, :key => :id
            String :admin_username
            String :name, :unique => true
            String :organizer
            String :organizer_web
            String :organizer_telephone
            String :organizer_email
            String :venue
            String :town
            String :country
            Time :date_start
            Time :date_end
            Time :app_deadline
            Integer :n_participants
            Integer :n_leaders
            String :description, :text => true
            String :app_description, :text => true
            Integer :state, :default => 0 #disabled
            String :leaders
        end

        @db.create_table? :applications do
            primary_key :id
            foreign_key :event_id, :events, :key => :id
            String :event_name
            foreign_key :applicant_id, :users, :key => :id
            String :applicant_username
            String :application_data, :text => true
            Integer :state
            Time :app_time
        end


        @db.create_table? :evaluations do
            primary_key :id
            foreign_key :event_id, :events, :key => :id
            foreign_key :application_id, :applications, :key => :id
            foreign_key :author_id, :users, :key => :id
            Integer :mark
            #String :internal_comment, :text => true
            #String :external_comment, :text => true
        end
    end
end
