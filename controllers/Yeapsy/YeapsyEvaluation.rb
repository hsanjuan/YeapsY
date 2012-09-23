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


module YeapsyEvaluation

    private

    # Evaluations are not listed
    #def list_evaluations
    #    [200,[].to_json]
    #end

    # Create a new evaluation
    def create_evaluation(info)

        info_hash = Yeapsy.parse_json(info)
        if Yeapsy.is_error?(info_hash)
            return info_hash.to_json
        end

        # Important, loggged user is the author
        info_hash[:author_id] = @user_id
        event = Event[info_hash[:event_id]]
        return YeapsyError.nonexistent('event').to_json if !event

        leaders = event.leaders.split(',')

        # If the user id is not leader or admin for then it cannot evaluate
        if @user_id != event.admin_id && !leaders.include?(@username)
            return YeapsyError.forbidden('create evaluation').to_json
        end

        #cannot add evaluation for an application which is in a different event
        if !event.applications_dataset.first(:id => info_hash[:application_id])
            return YeapsyError.forbidden('create evaluation for an application to a different event').to_json
        end

        fields = [:event_id, :application_id, :author_id, :mark]

        eval = Evaluation.new
        eval.update_fields(info_hash, fields, {:missing => :raise})
        [200, eval.to_json]

    rescue Sequel::Error => e
        return YeapsyError.new("Error creating evaluation",
                               e.message,
                               403).to_json
    rescue => e
        return YeapsyError.new("Error creating evaluation",
                               e.message, 500).to_json
    end

    # Change a mark
    def modify_evaluation(id, info)

        info_hash = Yeapsy.parse_json(info)
        if Yeapsy.is_error?(info_hash)
            return info_hash.to_json
        end

        begin
            eval = Evaluation[id]
            return YeapsyError.nonexistent('eval').to_json if !eval

            # Do not allow to change other users evaluations
            if @user_id != eval.author_id
                return YeapsyError.forbidden('modify evaluation').to_json
            end

            fields = [:mark]
            eval.update_fields(info_hash, fields, {:missing => :skip})
            return [200, eval.to_json]
        rescue Sequel::Error => e
            return YeapsyError.new("Error modifying evaluation",
                                   e.message,
                                   403).to_json
        rescue => e
            return YeapsyError.new("Error modifying evaluation",
                                   e.message, 500).to_json
        end
    end

    #evaluations cannot be deleted ever. They dissapear when the event
    # or the user application does
    def delete_evaluation(id)
        YeapsyError.forbidden('delete evaluation. Really.').to_json
    end
end
