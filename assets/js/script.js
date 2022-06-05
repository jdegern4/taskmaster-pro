var tasks = {};

var createTask = function(taskText, taskDate, taskList) {
  // CREATE ELEMENTS THAT MAKE UP A TASK ITEM
  var taskLi = $("<li>").addClass("list-group-item");
  
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  
    var taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);

  // APPEND SPAN AND P ELEMENT TO PARENT LI
  taskLi.append(taskSpan, taskP);

  // CHECK DUE DATE
  auditTask(taskLi);


  // APPEND TO UL LIST ON THE PAGE
  $("#list-" + taskList).append(taskLi);
};

var loadTasks = function() {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // IF NOTHING IN LOCAL STORAGE, CREATE NEW OBJECT TO TRACK ALL TASK STATUS ARRAYS
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // LOOP OVER OBJECT PROPERTIES
  $.each(tasks, function(list, arr) {
    console.log(list, arr);
    // THEN LOOP OVER SUB ARRAY
    arr.forEach(function(task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

var auditTask = function(taskEl) {
  // GET DATE FROM TASK ELEMENT
  var date = $(taskEl).find("span").text().trim();

  // CONVERT TO MOMENT OBJECT AT 5:00 PM
  var time = moment(date, "L").set("hour", 17);
  
  // REMOVE ANY OLD CLASSES FROM ELEMENT
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");

  // APPLY NEW CLASS IF TASK IS NEAR OR OVER DUE DATE

  if (moment().isAfter(time)) {
    $(taskEl).addClass("list-group-item-danger");
  }
  else if (Math.abs(moment().diff(time, "days")) <= 2) {
    $(taskEl).addClass("list-group-item-warning");
  }
};

$(".list-group").on("click", "p", function() {
  var text = $(this)
  .text()
  .trim();
  var textInput = $("<textarea>")
  .addClass("form-control")
  .val(text);
  $(this).replaceWith(textInput);
  textInput.trigger("focus");
});

$(".list-group").on("blur", "textarea", function() {
  // GET THE TEXTAREA'S CURRENT VALUE/TEXT
  var text = $(this)
    .val()
    .trim();

  // GET THE PARENT ul'S id ATTRIBUTE
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");

  var index = $(this)
    .closest(".list-group-item")
    .index();

  tasks[status][index].text = text;
  saveTasks();

  // RECREATE p ELEMENT
  var taskP = $("<p>")
    .addClass("m-1")
    .text(text);

  // REPLACE TEXTAREA WITH P ELEMENT
  $(this).replaceWith(taskP);
});

// DUE DATE WAS CLICKED
$(".list-group").on("click", "span", function() {
  // GET CURRENT TEXT
  var date = $(this)
    .text()
    .trim();

  // CREATE NEW INPUT ELEMENT
  var dateInput = $("<input>")
    .attr("type", "text")
    .addClass("form-control")
    .val(date);

  // SWAP OUT ELEMENTS
  $(this).replaceWith(dateInput);

  // ENABLE JQUERY UI DATEPICKER
  dateInput.datepicker({
    minDate: 1,
    onClose: function() {
      // WHEN CALENDAR IS CLOSED, FOCE A "CHANGE" EVENT ON THE 'dateInput'
      $(this).trigger("change");
    }
  });

  // AUTOMATICALLY FOCUS ON NEW ELEMENT
  dateInput.trigger("focus");
});

// VALUE OF DUE DATE WAS CHANGED
$(".list-group").on("change", "input[type='text']", function() {
  // GET CURRENT TEXT
  var date = $(this)
    .val();

  // GET THE PARENT ul'S id ATTRIBUTE
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");

  // GET THE TASK'S POSITION IN THE LIST OF OTHER li ELEMENTS
  var index = $(this)
    .closest(".list-group-item")
    .index();

  // UPDATE TASK IN ARRAY AND RE-SAVE TO LOCALSTORAGE
  tasks[status][index].date = date;
  saveTasks();

  // RECREATE SPAN ELEMENT WITH BOOTSTRAP CLASSES
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(date);

  // REPLACE INPUT WITH SPAN ELEMENT
  $(this).replaceWith(taskSpan);

  // PASS TASK'S <li> ELEMENT INTO auditTask() TO CHECK NEW DUE DATE
  auditTask($(taskSpan).closest(".list-group-item"));
});


// MODAL WAS TRIGGERED
$("#task-form-modal").on("show.bs.modal", function() {
  // CLEAR VALUES
  $("#modalTaskDescription, #modalDueDate").val("");
});

// MODAL IS FULLY VISIBLE
$("#task-form-modal").on("shown.bs.modal", function() {
  // HIGHLIGHT TEXTAREA
  $("#modalTaskDescription").trigger("focus");
});

// SAVE BUTTON IN MODAL WAS CLICKED
$("#task-form-modal .btn-save").click(function() {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // CLOSE MODAL
    $("#task-form-modal").modal("hide");

    // SAVE IN TASKS ARRAY
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    saveTasks();
  }
});

// REMOVE ALL TASKS
$("#remove-tasks").on("click", function() {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

// LOAD TASKS FOR THE FIRST TIME
loadTasks();

$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  activate: function(event) {
    $(this).addClass("dropover");
    $(".bottom-trash").addClass("bottom-trash-drag");
  },
  deactivate: function(event) {
    $(this).removeClass("dropover");
    $(".bottom-trash").removeClass("bottom-trash-drag");
  },
  over: function(event) {
    $(event.target).addClass("dropover-active");
  },
  out: function(event) {
    $(event.target).removeClass("dropover-active");
  },
  update: function(event) {
    var tempArr = [];
    // LOOP OVER CURRENT SET OF CHILDREN IN SORTABLE LIST
    $(this).children().each(function() {
      var text = $(this)
        .find("p")
        .text()
        .trim();

      var date = $(this)
        .find("span")
        .text()
        .trim();

      // ADD TASK DATA TO THE TEMP ARRAY AS AN OBJECT
      tempArr.push({
        text: text,
        date: date
      });
    });

    var arrName = $(this)
      .attr("id")
      .replace("list-", "");

    // UPDATE ARRAY ON TASKS OBJECT AND SAVE
    tasks[arrName] = tempArr;
    saveTasks();

    console.log(tempArr);
  }
});

$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function(event, ui) {
    ui.draggable.remove();
    $(".bottom-trash").removeClass("bottom-trash-active");
  },
  over: function(event, ui) {
    console.log(ui);
    $(".bottom-trash").addClass("bottom-trash-active");
  },
  out: function(event, ui) {
    $(".bottom-trash").removeClass("bottom-trash-active");
  }
});

$("#modalDueDate").datepicker({
  minDate: 1
});

setInterval(function() {
  $(".card .list-group-item").each(function(index, el) {
    auditTask(el);
  });
}, 1800000);

