# MFiles RESTful API Javascript Library

A JavaScript library written with jQuery used to fetch (any) View from a configured MFiles Vault.

Requires:
* jQuery 2.4.*+
* access to an MFiles RESTful API
* the URL used to access the MFiles RESTful API
* details for an account configured within MFiles
* the Vault ID must be added to the <script> tage below: data-vault-id="VAULTID"
* the View ID must be added to the <script> tag below: data-view-id="VIEWID"
* configure the path to load the JS file to suit your requirements
* add your own icon images - we were lazy and just used *.jpg - they really should be *.svg
* pass the MFiles user password to a DOM JavaScript variable: mfilesuser (if you change this update the getToken() function)
* don't forget to add the MFiles username to the getToken() function as well

You can use this template below to implement:
<div class="row">
  <div id="mfiles-header" class="col mfiles-header">
    <span id="mfiles-crumbs" class="gc-crumbs float-left"></span>
    <span id="mfiles-action" class="gc-action float-right"></span>
  </div>
</div>
<div class="row">
  <div id="mfiles-box" class="col mfiles-content">&nbsp;</div>
</div>
<div id="mfiles_modal" class="modal">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <h3>Document Preview</h3>
      <div class="modal-header js-mfiles-title">&nbsp;</div>
      <div class="modal-body js-mfiles-properties">&nbsp;</div>
      <div class="modal-footer">
        <button id="mfiles-download-file" class="btn btn-success float-right" data-action="download">Download</button> 
        <button id="mfiles-cancel-download" class="btn btn-danger" data-dismiss="modal">Cancel</button>
      </div>
    </div>
  </div>
</div>
<script src="/src/mfiles.js" type="text/javascript" data-vault-id="<VAULT ID GOES HERE>" data-view-id="<VIEW ID GOES HERE>"></script>

## You can of course rewrite the JS code so that it renders all of the requiured HTML DOM elements
