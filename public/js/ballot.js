'use strict';

//create a file-specific context via a function
(function(piv) {
var view = piv.view
view.setHeader("Cast Ballot")

piv.anchorListDiv(view.workspace, "", {
    "Rank Candidates": "/ballot/" + election,
    "Review ballot": "/ballotReview/" + election
  }
)

piv.removeHrefsForCurrentLoc()  //remove hrefs that link to the current page

piv.doOnEvents2(view.workspace, ["click"], function(e) {piv.evmanage.bubble(e)} )

view.rankeditems = piv.html(view.workspace, "ol", "", {"id": "rankeditems", "class": "itemlist incrementsCounter grabbable hasLabelFrame"});
view.unrankeditems = piv.html(view.workspace, "ul", "", {"id": "unrankeditems", "class": "itemlist cursorPointer hasLabelFrame"});

piv.loadBallot(election, piv.displayBallot, li1)
setUpDragHandling(view.rankeditems, view.unrankeditems)

function li1(parent, id, description, cost, tie, isNew) {
  var candidateLiAtts = {"class": "row1", "data-id": id}

  if ("new" == isNew) { candidateLiAtts["data-isNew"] = "new" }
  if (tie) { candidateLiAtts["data-tie"] = tie }
  var box = piv.html(parent, "li", "", candidateLiAtts)

  piv.div(box, "", "hidden1 text1", "new")
  piv.div(box, "", "text1square orderdisplay");
  piv.div(box, "", "grabbable text1", "^v");
  piv.div(box, "", "text1 w67", description);
  var checkbox = piv.html(box, "input", "", {"type": "checkbox", "class": "hidden2 text1square cursorPointer", "name": "ballotcheck", "id": "ballotcheck-" + id})
  var tiebutton = piv.div(box, "", "hidden3 clickable1", "tie")
  // piv.doOnEvents2(tiebutton, ["click"], tieSelected)

  var xbutton = piv.div(box, "", "hidden3 clickable1", "X", "")

  // piv.doOnEvents2(box, ["click"], candidateClick, [checkbox, tiebutton, xbutton])
  piv.domeldata.set(box, id, "id")
  piv.domeldata.set(checkbox, box, "box")
  piv.boxlist = piv.boxlist || [];
  piv.boxlist.push(box)
  piv.evmanage.listen(box, "click", candidateClick, [box])
  // piv.evmanage.listen(checkbox, "click", updateCheckedCandidateList, [id, box, checkbox])
  piv.evmanage.listen(tiebutton, "click", tieSelected)
  piv.evmanage.listen(xbutton, "click", sendToEnd)
}

function setUpDragHandling(rankeditems, unrankeditems) {
  var tieCleanupNeeded = false, dragStartState = {}
  var drake = dragula([rankeditems, unrankeditems])

  drake.on('drag', function (el) { onCandidateDrag(el) })
  drake.on('drop', function (el) { onCandidateDrop(el) })

  // saves off data that we will need on drop
  function onCandidateDrag(domel) {
    dragStartState.prevSibling = domel.previousElementSibling
    dragStartState.nextSibling = domel.nextElementSibling
    dragStartState.tieStatus = getTieStatus(domel)
  }
  function onCandidateDrop(domel) {
    updateFormerSiblingTieStatuses(dragStartState.tieStatus, dragStartState.prevSibling, dragStartState.nextSibling)  // update the tie statuses for the element's former siblings
    setTieStatusAfterDrop(domel)  // update the tie status based on where the element was dragged to
    onReorder(domel)
  }
  function setTieStatusAfterDrop(domel) {
    var tieStat = getTieStatus(domel.previousElementSibling)
    if (!tieStat || "end" == tieStat) {
      setTieStatus(domel, "none")
      return
    }
    setTieStatus(domel, "middle")
  }
}

function getTieStatus(domel) {
  if (!domel) return null
  return domel.getAttribute("data-tie")
}
function setTieStatus(domel, position) {
  if (position == "none") {
    domel.removeAttribute("data-tie")
  }
  else {
    domel.setAttribute("data-tie", position)
  }
}

// noe - maybe needs some work (including everything that uses it). not sure how much I like this paradigm in general
function updateFormerSiblingTieStatuses(tieStat, prevSibling, nextSibling) {
  var sibling, sibTieStat

  // don't need to do anything of the dragged item was in the middle of a tie or not part of a tie
  if (!tieStat || "middle" == tieStat) return

  // if the dragged element was the START of a tie, we need to update the NEXT element sibling
  if ("start" == tieStat) {
    sibling = nextSibling, sibTieStat = getTieStatus(sibling)
    if ("end" == sibTieStat) {
      setTieStatus(sibling, "none") // there were only two elements in this tie, so there is no tie anymore
      return
    }
    if ("middle" == sibTieStat) {
      setTieStatus(sibling, "start") // the next sibling becomes the new start for this tie
      return
    }
    else return
  }

  // if the dragged element was the END of a tie, we need to update the PREVIOUS element sibling
  sibling = prevSibling, sibTieStat = getTieStatus(sibling)
  if ("start" == sibTieStat) {
    setTieStatus(sibling, "none") // there were only two elements in this tie, so there is no tie anymore
  }
  else if ("middle" == sibTieStat) {
    setTieStatus(sibling, "end") // the previous sibling becomes the new end for this tie
  }
}
function getCheckedCandidates(uncheck) {
  var candidates = [], checkbox, checkboxes = document.querySelectorAll("input:checked")

  for (var i = 0; i < checkboxes.length; i++) {
    checkbox = checkboxes[i]
    candidates.push({
      "box": piv.domeldata.get(checkbox, "box"),
      "checkbox": checkbox
    })
    if (uncheck) checkbox.checked = false
  }

  return candidates
}
function tieSelected(box, checkbox, rankeditems, afterEl) {
  var candidate, candidates = getCheckedCandidates("uncheck")
  if (candidates.length < 1) return  //no need to do anything if there is only one candidate selected

  // loop over all the candidates except the first and last and insert them after the first candidate
  for (var i = 1; i < candidates.length; i++) {
    candidate = candidates[i]
    updateFormerSiblingTieStatuses( getTieStatus(candidate.box), candidate.box.previousElementSibling, candidate.box.nextElementSibling)
    setTieStatus(candidate.box, "middle")
    piv.insertAfter(candidate.box, candidates[i - 1].box)
  }

  // set the tie statuses of the first and last elements
  var boxFirst = candidates[0].box, boxLast = candidates[candidates.length - 1].box
  var tieAtt = getTieStatus(boxFirst)
  if (!tieAtt) {
    setTieStatus(boxFirst, "start")
    setTieStatus(boxLast, "end")
  }
  else if ("end" == tieAtt) {
    setTieStatus(boxFirst, "middle")
    setTieStatus(boxLast, "end")
  }
  else {
    setTieStatus(boxLast, "middle")
  }
  onReorder()
}
function sendToEnd() {
  var box, candidates = getCheckedCandidates("uncheck")

  for (var i = 0; i < candidates.length; i++) {
    box = candidates[i].box
    updateFormerSiblingTieStatuses( getTieStatus(box), box.previousElementSibling, box.nextElementSibling)
    setTieStatus(box, "none")
    view.unrankeditems.appendChild(box);
  }
  onReorder()
}
function candidateClick(box) {
  if (this.eContext.log.length > 0) return  //quit if the user clicked one of the action buttons
  if (box.parentElement == view.rankeditems) return   //no action when clicking a ranked item
  view.rankeditems.appendChild(box);
  onReorder(box);
}
function onReorder(candidateEl) {
  if (candidateEl) { candidateEl.removeAttribute("data-isNew")}
  updateInstructions(view.rankeditems.childElementCount);
  saveRankings();
}
function updateInstructions(rankeditemsCount) {
  // var header = document.getElementById("instructions");
  // if (document.getElementById("unrankeditems").childElementCount == 0) {
  //   header.innerHTML = "You may continue sorting items. When satisfied, you can move on to the Review step.";
  //   return;
  // }
  // header.innerHTML = "Select your " + ordinalSuffix(rankeditems.childElementCount + 1) + " choice";
}

var saveStatus = ""
function saveRankings() {
  //if a save is already in progress, just record that we need to save again and quit
  if (("saving" == saveStatus) || ("queued" == saveStatus)) {
    saveStatus = "queued"
    return "queued"
  }
  saveStatus = "saving"
  updateStatusDisplay("Saving")
  var candidateRanks = {}
  candidateRanks.votes = makeRankingsArray()
  batchVote(election, candidateRanks)
  return "saving"
}
function finishSaveRankings(response) {
  if ("queued" == saveStatus) {
    saveStatus = "saved"  //reset saveStatus so that saveRankings doesn't just quit
    saveRankings()
    return
  }
  saveStatus = "saved"
  updateStatusDisplay("Saved!")
}
function updateStatusDisplay(newStatus) {
  var saveStatusDomEl = document.getElementById("saveStatusDomEl")
  if (!saveStatusDomEl) { saveStatusDomEl = piv.div(view.workspace, "saveStatusDomEl", "text1")}
  saveStatusDomEl.innerHTML = newStatus
}
function makeRankingsArray () {
  var rankings = [];
  candidatesToArray(document.querySelectorAll("#rankeditems li"), rankings, "getRanking");
  candidatesToArray(document.querySelectorAll("#unrankeditems li"), rankings);

  return rankings
}

function candidatesToArray(candidates, targetArray, isRanked) {
  var tieStat, isTiedWthPrevious, rank = 0
  for (var i = 0; i < candidates.length; i++) {
    var item = {};

    item.candidate_id = candidates[i].getAttribute("data-id");

    if (isRanked != "getRanking") {
      item.rank = 0
      targetArray.push(item)
      continue
    }

    tieStat = getTieStatus(candidates[i])
    isTiedWthPrevious = ((tieStat == "middle") || (tieStat == "end"))
    if (isTiedWthPrevious) {item.rank = rank}
    else {item.rank = ++rank}

    targetArray.push(item);
  }
};
function batchVote(electionId, candidateRanks) {
  if (!electionId) {return}
  piv.postToResource('/api/election/' + electionId + '/batchvote', candidateRanks, finishSaveRankings)
}

// close the self-executing function and feed the piv library to it
})(piv)
