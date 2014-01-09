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

module YeapsyUser

    RANK = {
        :superadmin => 0,
        :admin => 1,
        :user => 2}

    RANK_INV = [:superadmin, :admin, :user]

    private

    # List users
    def list_users
        #superadmin lists all users, otherwise only myself
        users = @user_rank == :superadmin ? User.all : [User[@user_id]]
        # Do not include password
        users.collect! do |user|
            hash = user.values
            hash.delete(:password)
            hash
        end

        return [200, users.to_json]
    end

    # Create a new user
    def create_user(info)
        #only when logged in superadmin
        if @user_rank != :superadmin
            return YeapsyError.forbidden('create user').to_json
        end

        info_hash = Yeapsy.parse_json(info)
        if Yeapsy.is_error?(info_hash)
            return info_hash.to_json
        end

        fields = [:username, :name, :password, :email]
        info_hash[:username].downcase! if info_hash[:username]
        info_hash[:email].downcase! if info_hash[:email]

        begin
            user = User.new()
            user.update_fields(info_hash,fields, {:missing => :skip});
            # Set password this way so it is hashed
            user.password = info_hash[:password]
            user.enabled = true
            user.reg_date = Time.now
            user.save_changes
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

    # Get full information about a user, except password
    def get_user(id)
        #superadmin -> all users
        #rest -> myself
        #user info can be accesed via the /events/:applications
        if @user_rank != :superadmin && @user_id != id
            return YeapsyError.forbidden("get user").to_json
        end

        return YeapsyError.nonexistent('user').to_json if !User[id]

        begin
            return [200, User[id].to_json(:except => :password)]
        rescue => e
            return YeapsyError.new("Error getting user",
                                   e.message, 500).to_json
        end
    end

    # Modify user information
    def modify_user(id, info)
        #user information can only be modified by the own user
        #or superadmin
        if @user_rank != :superadmin && @user_id != id
            return YeapsyError.forbidden("modify user").to_json
        end

        info_hash = Yeapsy.parse_json(info)
        if Yeapsy.is_error?(info_hash)
            return info_hash.to_json
        end

        fields = [:name, :email, :birth_date, :gender, :passport, :address,
                 :country, :telephone, :organization, :about_public,
                  :about_private, :nationality, :birth_place]

        # Only super admin can set user rank
        fields << :rank if @user_rank == :superadmin && info_hash[:rank]
        fields << :password if info_hash[:password]

        info_hash[:email].downcase! if info_hash[:email]

        user = User[id]
        return YeapsyError.nonexistent('user').to_json if !user

        # When we provide a new password we have to check
        # whether the cooked old password is correct
        if info_hash[:password]
            provided_old_pw = Yeapsy.cook(info_hash[:old_password],id)
            old_pw = user.password
            if old_pw != provided_old_pw
                return YeapsyError.new("Error changing password",
                                       "Wrong password", 403).to_json
            end
        end

        begin
            user.update_fields(info_hash,fields, {:missing => :skip})
            return [200, user.to_json(:except => :password)]
        rescue Sequel::Error => e
            return YeapsyError.new("Error modifying user",
                                   e.message,
                                   403).to_json
        rescue => e
            return YeapsyError.new("Error modifying user",
                                   e.message, 500).to_json
        end
    end

    def delete_user(id)
        #superadmin or user can delete themselves
        if @user_rank != :superadmin && @user_id != id
            return YeapsyError.forbidden('delete user').to_json
        end

        begin
            user = User[id]
            return YeapsyError.nonexistent('user').to_json if !user
            user.destroy #deletes associated models

            if @config[:activity_watch]
                @mail.send(nil, nil,
                          "Yeapsy: deleted user",
                          "User #{user.username} has been deleted")
            end

            return [200, user.to_json(:except => :password)]
        rescue => e
            return YeapsyError.new("Error deleting user",
                                   e.message, 500).to_json
        end
    end
end
