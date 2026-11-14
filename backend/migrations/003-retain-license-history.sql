ALTER TABLE licenses DROP CONSTRAINT licenses_software_id_fkey;
ALTER TABLE licenses ADD CONSTRAINT licenses_software_id_fkey
  FOREIGN KEY (software_id) REFERENCES software(id) ON DELETE RESTRICT;
