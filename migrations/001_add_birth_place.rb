Sequel.migration do
    change do
        add_column :users, :birth_place, String
    end
end
