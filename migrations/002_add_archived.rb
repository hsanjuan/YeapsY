Sequel.migration do
    change do
        add_column :applications, :archived, TrueClass
    end
end
