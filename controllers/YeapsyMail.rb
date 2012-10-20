require 'pony'

# Handles sending of mail with pony
class YeapsyMail

    # Set email configuration and contact for from field
    def initialize(config)
        @contact = config[:contact]
        @email_from = config[:email_from]
        @via = config[:mail_via].to_sym
        @address = config[:smtp_address]
        @user_name = config[:smtp_user_name]
        @port = config[:smtp_port]
        @password = config[:smtp_password]
        @authentication = config[:smtp_authentication]
        @authentication = @authentication.to_sym if @authentication
        @enable_starttls_auto = config[:smtp_enable_starttls_auto]
    end

    # Send an email]
    # Fork smtp send and leave it to a thread, since it takes long
    def send(from, to, subject, message)
        if !from then from = @email_from end
        if !to then to = @contact end
        case @via
        when :sendmail
            Pony.mail({:from => from,
                          :to => to,
                          :subject => subject,
                          :body => message,
                          :via => :sendmail})
        when :smtp
            p = fork do
                begin
                    Pony.mail({
                                  :from => from,
                                  :to => to,
                                  :subject => subject,
                                  :body => message,
                                  :via => :smtp,
                                  :via_options => {
                                      :address => @address,
                                      :port => @port,
                                      :user_name => @user_name,
                                      :password => @password,
                                      :authentication => @authentication,
                                      :enable_starttls_auto => @enable_starttls_auto
                                  }
                              })
                rescue => e
                    # Log error
                    YeapsyError.new('Error sending mail', e.message)
                end
            end
            Process.detach(p)
        else
            raise 'No known mail method set'
        end

    end

    # Email templates
    # The following methods return email templates
    # for several situations in Yeapsy

    # Email for new password after password reset
    def self.pw_reset(new_pw)
        body = "Your YeapsY password has been resetted. You can now log in "
        body << "with the following password: \n\n#{new_pw}\n\n"
        body << "Yours sincerely,\n\nThe YeapsY Team."
        body
    end

    # Email for application state change
    def self.application_state_change(event,new_state)
        <<EOF
Hello,

This email is to inform you that the status of one your applications in YeapsY has changed:

Event: #{event}
New state: #{new_state.to_s.upcase}

The organizers may contact you separately when it proceeds.

Yours sincerely,

The Yeapsy Team

PS. Application status meanings:

    - Pending review - Your application needs to be reviewed by the activity leaders
    - Accepted - Your have been accepted to participate in the activity
    - Rejected - Your application has been rejected
    - Waiting list - Your application has been placed in waiting list
    - Other - Any other status
EOF
    end

    # Email after user registration
    def self.registration(username)
        <<EOF
Hello,

This email is the confirmation that you have successfully registered in YeapsY. Your username is:

#{username}

It is strongly recommended that you edit your YeapsY profile and fill in all the personal data, as most events need it to accept participants.

If you have not registered, please reply to this email and let us know.

Yours sincerely,

The YeapsY Team
EOF
    end

    # Email for administrator after user registration
    def self.new_user(username, email=nil)
        <<EOF
A new user

#{username}
#{email}

has registered in Yeapsy.
EOF
    end

    # Inform applicant that application was received
    def self.application_received(event_name)
        <<EOF
Hello,

This is a confirmation that your application to the event

#{event_name}

has been successfully received and stored in YeapsY.

You can check it from the "My applications" menu. You can also delete it from there if you change your mind. The organizers will contact you with further information when the time comes.

Yours sincerely,

The YeapsY Team
EOF
    end
end
