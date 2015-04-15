## upload-script

A couple of example scripts that use node.js to perform some operations on the BIMserver

### Installation

- Run "npm install" from the root directory of this repository

To use createproject.js run:

    node createproject.js <project-name> <bimserver-url> <username> <password>

Where project-name is a valid top level project name that you would like to create on the bimserver.

To use upload.js run:

    node upload.js <ifc-file-path> <bimserver-url> <username> <password>

Where ifc-file-path is a path to the ifc file that you would like to send to the bimserver. The script will prompt you which top level project you would like to upload your file to.

To use download.js run:

    node download.js <output-dir> <bimserver-url> <username> <password>

The script will prompt you for which top level project you would like to download all the revisions. The revisions will be saved as collada files in the output-dir. Revisions that already exist in the output-dir will not be downloaded again.

To use query.js run:

    node query.js <ifc-type> <bimserver-url> <username> <password>

Where ifc-type is the ifc type you would like the query to return, such as "IfcDoor". The script will prompt you for the project you would like to run the query on, it will run on the latest revision and will send the IFC data to standard out.