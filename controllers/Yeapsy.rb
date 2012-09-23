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

require 'controllers/Yeapsy/YeapsyUser'
require 'controllers/Yeapsy/YeapsyEvent'
require 'controllers/Yeapsy/YeapsyApplication'
require 'controllers/Yeapsy/YeapsyEvaluation'
require 'controllers/YeapsyError'
require 'controllers/emailRegexp'
require 'digest/sha2'

# Yeapsy performs all the operations to create, modify, delete and show
# resources

class Yeapsy

    # Full funciontality is achieved by adding the following modules
    include YeapsyUser
    include YeapsyEvent
    include YeapsyApplication
    include YeapsyEvaluation

    # Initialize an instance of Yeapsy, set some useful variables
    def initialize(db, user_id, username, rank, mail)
        @db = db
        @mail = mail
        @user_id = user_id
        @user_rank = RANK_INV[rank.to_i]
        @username = username
    end

    # Get the list of elements of this resource
    def list(resource)
        case resource
        when "event" then list_events
        when "user" then list_users
        when "application" then list_applications
        else
            YeapsyError.new("Unknown resource",
                            "Cannot list #{resource}", 404).to_json
        end
    end

    # Get a single resource
    def get(resource, id)
        case resource
        when "event" then get_event(id)
        when "user" then get_user(id)
        when "application" then get_application(id)
        else
            YeapsyError.new("Unknown resource",
                            "Cannot get item in #{resource}", 404).to_json
        end
    end

    # Create a resource
    def create(resource, info)
        case resource
        when "event" then create_event(info)
        when "user" then create_user(info)
        when "application" then create_application(info)
        when "evaluation" then create_evaluation(info)
        else
            YeapsyError.new("Unknown resource",
                            "Cannot create item in #{resource}", 404).to_json
        end
    end

    # Update a resource
    def modify(resource, id, info)
        case resource
        when "event" then modify_event(id,info)
        when "user" then modify_user(id,info)
        #when "application" then modify_application(id,info)
        when "evaluation" then modify_evaluation(id,info)
        else
            YeapsyError.new("Unknown resource",
                            "Cannot create item in #{resource}", 404).to_json
        end
    end

    def delete(resource, id)
        case resource
        when "event" then delete_event(id)
        when "user" then delete_user(id)
        when "application" then delete_application(id)
        else
            YeapsyError.new("Unknown resource",
                            "Cannot delete item in #{resource}", 404).to_json
        end
    end

    ###########################################################################
    ## Class methods
    ###########################################################################

    # Setups Yeapsy. Currently only adds the initial superadmin user
    # when no other users have been added
    def self.setup(config)
        if User.all.length == 0
            warn 'Yeapsy init: First user genesis'
            User.insert({:username => config[:username],
                            :password => Yeapsy.cook(config[:password],1),
                            :email => config[:email],
                            :rank => 0,
                            :enabled => true,
                            :reg_date => Time.now})
        end
    end

    # Register a new user in Yeapsy
    def self.register(info, mail)
        info_hash = Yeapsy.parse_json(info)
        if Yeapsy.is_error?(info_hash)
            return info_hash.to_json
        end

        # Check that human check is correct
        n1 = info_hash[:number1].to_i
        n2 = info_hash[:number2].to_i
        test = info_hash[:test].to_i
        if test <= 0 || test != n1 + n2
            return YeapsyError.forbidden('to register. Wrong human check').to_json
        end

        fields = [:username, :name, :password, :email]
        # Users are enforced downcase. No upcase/downcase dinstinction made
        # when logging in etc.
        info_hash[:username].downcase! if info_hash[:username]
        info_hash[:email].downcase! if info_hash[:email]


        begin
            user = User.new()
            user.update_fields(info_hash,fields, {:missing => :skip});
            user.reg_date = Time.now
            # If not set this way then it is not hashed/salted
            user.password = info_hash[:password]
            # Disable if extra email confirmation system is set up
            user.enabled = true
            user.save_changes

            # Send email to user and to contact
            mail.send(nil, user.email,
                       "You have successfully registered in YeapsY",
                       YeapsyMail.registration(user.username))
            # Comment if too annoying
            mail.send(nil, nil,
                      "Yeapsy: new user",
                      YeapsyMail.new_user(user.username, user.email))
            return [200, user.to_json(:except => :password)]
        rescue Sequel::Error => e
            return YeapsyError.new("Error creating user",
                                   e.message,
                                   403).to_json
        rescue => e
            return YeapsyError.new("Error creating user",
                                   e.message,
                                   500).to_json
        end
    end

    # Generate a new password and send it to user
    def self.reminder(info, mail)
        info_hash = Yeapsy.parse_json(info)
        if Yeapsy.is_error?(info_hash)
            return info_hash.to_json
        end

        begin
            user = User[:username => info_hash[:username].downcase]
            return YeapsyError.nonexistent('user').to_json if !user

            if user.email != info_hash[:email]
                return YeapsyError.forbidden('reset password. Wrong username or email.').to_json
            end

            new_pw = Yeapsy.random_str(8)
            user.password = new_pw
            user.save_changes

            #send password reminder
            mail.send(nil, user.email, 'Yeapsy: password resetted',
                      YeapsyMail.pw_reset(new_pw))

            return 204 #no content
        rescue => e
            return YeapsyError.new('Error resetting password',
                                   e.message, 500).to_json
        end
    end

    # Generate a random string
    def self.random_str(length)
        rand(36**length).to_s(36)
    end

    # Check if an object is error
    def self.is_error?(obj)
        obj.class == YeapsyError
    end

    # Parse JSON with symbolized names
    def self.parse_json(json)
        begin
            parser = JSON.parser.new(json,{:symbolize_names => true})
            parser.parse
        rescue => e
            YeapsyError.new("Parser error", "I don't understand :S", 500)
        end
    end

    # Check if an email address is valid
    # ADDR_SPEC is defined in emailRegexp.rb
    def self.valid_email(string)
        return false if !string || string.empty?
        string =~ ADDR_SPEC
    end

    # Cook a password: salt and hash a string
    def self.cook(string, salt)
        salted = "#{salt}::#{string}::#{salt}"
        return Digest::SHA2.hexdigest(salted)
    end
end
