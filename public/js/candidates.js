'use strict';

//create a file-specific context via a function
(function(Piv, Dragula) {

// script-level variables
var View = Piv.view
var Election = election
var SaveCandidatesButton, RevertChangesButton
var OriginalCandidatesFromServer, SaveInProgress
var CandidateDirectory = Piv.makeVobjectCollection()
// var CandidateDirectory = {}
Piv.CandidateDirectory = CandidateDirectory
var Edititems

// actions (do stuff)
Piv.evmanage.setManager(View.workspace, ["click", "keyup", "paste"])

View.setHeader("Candidates")

Piv.anchorListDiv(View.workspace, "", {
    "Election details": "/administer/" + election,
    "Add/Edit candidates": "/candidates/" + election,
    "Manage electorate": "/electorate/" + election
  }
)

Piv.removeHrefsForCurrentLoc()  //remove hrefs that link to the current page

Edititems = Piv.html(View.workspace, "ol", "", {"id": "edititems", "class": "itemlist incrementsCounter"})
Dragula([Edititems])
// Drake.on('drop', function (el) { onCandidateDrop(el); })

Piv.div(View.workspace, "", "clickable1", "+ Add Candidates", "", "click", addCandidate);
RevertChangesButton = Piv.div(View.workspace, "", "clickable1 disabled", "Revert Changes", "", "click", revertChanges);
SaveCandidatesButton = Piv.div(View.workspace, "", "clickable1 disabled", "Save Election", "", "click", saveCandidates, [election]);

loadCandidates(Election, displayCandidates)

// function definitions
function loadCandidates(electionId, onSuccessFunction) {
  if (!electionId) return
  // (candidate and batch_candidates are the same)
  // Piv.getResource('/api/election/' + electionId + "/candidate", onSuccessFunction)
  Piv.getResource("/api/election/" + electionId + "/batch_candidates", onSuccessFunction)
}
function revertChanges() {
  if (SaveInProgress) {
    console.log("Save in progress")
    return
  }
  resetCandidates()
  displayCandidates(OriginalCandidatesFromServer)
}
function resetCandidates() {
  Piv.removeAllChildren(Edititems)
  CandidateDirectory.reset()
  updateSaveButton()
}
function displayCandidates(candidates) {
  var candidate
  resetCandidates()
  OriginalCandidatesFromServer = candidates  //save off candidates so the user can revert their changes if need be
  for (var key in candidates) {
    candidate = candidates[key]
    displayCandidate(Edititems, candidate.id, candidate.name)
  }
}
function displayCandidate(parent, id, name, status) {
  var vobject = {"id": id, "status": status || "current", "original_name": name}
  CandidateDirectory.push(vobject)

  var candidateLiAtts = {"class": "row1"}
  if (id) { candidateLiAtts["data-id"] = id}

  var box = vobject.domel = Piv.html(parent, "li", "", candidateLiAtts);
  Piv.div(box, "", "grabbable", "#");
  Piv.div(box, "", "grabbable", "^v");
  var input = vobject.name = Piv.html(box, "input", "", {"class": "text1 w75", "type": "text", "value": (name || ""), "placeholder": "Candidate name/description"});
  Piv.evmanage.listen(input, "keyup", onNameChange, [vobject])
  Piv.evmanage.listen(input, "paste", onNameChange, [vobject])
  Piv.div(box, "", "clickable1", "X", "", "click", removeCandidate, [vobject]);

  return vobject
}
function onNameChange(vobject) {
  if (vobject.status == "new") return  //don't need to track changes for new objects
  if (vobject.name.value == vobject.original_name) {
    CandidateDirectory.status(vobject, "current")
    updateSaveButton()
    return
  }
  if (CandidateDirectory.status(vobject) == "changed") return
  CandidateDirectory.status(vobject, "changed")
  updateSaveButton()
}
function addCandidate() {
  displayCandidate(Edititems, "", "", "new").name.focus()
  updateSaveButton()
}
function removeCandidate(vobject) {
  if ("new" == vobject.status) {
    CandidateDirectory.status(vobject, "ignore")
    vobject.domel.parentElement.removeChild(vobject.domel)
    updateSaveButton()
    return
  }
  if ("changed" == vobject.status) {
    CandidateDirectory.status(vobject, "deleted")
  }
  CandidateDirectory.status(vobject, "deleted")
  vobject.domel.parentElement.removeChild(vobject.domel)

  updateSaveButton()
}
function updateSaveButton() {
  if ( CandidateDirectory.length("new") > 0 ) {
    buttonEnableDisable(SaveCandidatesButton, "enable")
    buttonEnableDisable(RevertChangesButton, "enable")
  }
  else if ( CandidateDirectory.length("changed") > 0) {
    buttonEnableDisable(SaveCandidatesButton, "enable")
    buttonEnableDisable(RevertChangesButton, "enable")
  }
  else if ( CandidateDirectory.length("deleted") > 0) {
    buttonEnableDisable(SaveCandidatesButton, "enable")
    buttonEnableDisable(RevertChangesButton, "enable")
  }
  else {
    buttonEnableDisable(SaveCandidatesButton, "disable")
    buttonEnableDisable(RevertChangesButton, "disable")
  }
}
function buttonEnableDisable(button, disable) {
  if ("disable" == disable) { Piv.addClass(button, "disabled") }
  else { Piv.removeClass(button, "disabled") }
}
function saveCandidates(electionId) {
  var deleteResources = []

  if (SaveInProgress) {
    console.log("Save in progress")
    return
  }
  SaveInProgress = true
  var innerHtml = SaveCandidatesButton.innerHTML

  for (var i in CandidateDirectory.indexes.deleted) {
    deleteResources.push("/api/election/" + electionId + "/candidate/" + CandidateDirectory.indexes.deleted[i].id)
  }
  if (deleteResources.length > 0) {
    SaveCandidatesButton.innerHTML = "Deleting..."
    Piv.deleteMultResources(deleteResources, function() {
      // for (var i = 0; i < arguments.length; i++) {
      // }
      saveCandidateList(electionId, innerHtml)
    })
  }
  else saveCandidateList(electionId, innerHtml)
}
function saveCandidateList(electionId, innerHtml) {
  var newAndChangedCandidates = []
  SaveCandidatesButton.innerHTML = "Saving..."

  for (var i in CandidateDirectory.indexes.new) {
    newAndChangedCandidates.push({"name": CandidateDirectory.indexes.new[i].name.value})
  }
  for (var i in CandidateDirectory.indexes.changed) {
    newAndChangedCandidates.push({
      "name": CandidateDirectory.indexes.changed[i].name.value,
      "id": CandidateDirectory.indexes.changed[i].id })
  }
  if (newAndChangedCandidates.length < 1) {
    SaveInProgress = false
    SaveCandidatesButton.innerHTML = innerHtml
    // loadCandidates(Election, displayCandidates)  //re-load candidates so that we reset OriginalCandidatesFromServer and ensure that we have the latest list
    return
  }
  Piv.postToResource("/api/election/" + electionId + "/batch_candidates", {"candidates": newAndChangedCandidates}, function(candidates) {
    displayCandidates(candidates)
    SaveInProgress = false
    SaveCandidatesButton.innerHTML = innerHtml
  })
}

// close the self-executing function and feed libraries to it
})(piv, dragula)
