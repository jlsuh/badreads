const createBook = function(title, author, pages, imageLink, alreadyRead) {
  const newBook = Object.create(bookProto);
  return Object.assign(newBook, {title, author, pages, imageLink, alreadyRead});
};
const bookProto = {
  readOrNot() {
    return this.alreadyRead ? "already read" : "not read yet";
  },
  info() {
    return `${this.title} by ${this.author}, ${this.pages} pages, ${this.readOrNot()}`;
  },
  toggleRead() {
    this.alreadyRead = !this.alreadyRead;
  }
};

function Card(book) {
  this.book = book;
  [this.imageLink, this.alt] =
    (book.imageLink !== "" && isValidHttpUrl(book.imageLink)) ?
      [book.imageLink, `${this.book.title} book photo`] : ["/img/no-photo.jpg", "No photo provided photo"];
  this.associatedDiv = document.createElement("div");
  function isValidHttpUrl(str) {
    let url;
    try {
      url = new URL(str);
    } catch (_) {
      return false;  
    }
    return url.protocol === "http:" || url.protocol === "https:";
  }
  Card.prototype.setImageAttrs = function(img) {
    img.src = this.imageLink;
    img.alt = this.alt;
    return img;
  }
  Card.prototype.createImage = function() {
    const img = document.createElement("img");
    this.setImageAttrs(img);
    return img;
  }
  Card.prototype.createButton = function(className, textContent, callback) {
    const removeButton = document.createElement("button");
    removeButton.classList.add(className);
    removeButton.textContent = textContent;
    removeButton.addEventListener("click", callback);
    return removeButton;
  }
}
Card.prototype.createBookPhoto = function() {
  const bookPhoto = document.createElement("div");
  const img = this.createImage(this.imageLink);
  bookPhoto.classList = "book-photo";
  bookPhoto.appendChild(img);
  this.associatedDiv.appendChild(bookPhoto);
  return this;
}
Card.prototype.createBookInfo = function(bookRemover, readToggler) {
  const bookInfo = document.createElement("div");
  const info = document.createElement("div");
  const removeButton = this.createButton("remove-button", "Remove", bookRemover);
  const buttonContainer = document.createElement("div");
  const readToggleButton = this.createButton("read-toggle", "Toggle Read", readToggler);
  bookInfo.classList.add("book-info");
  info.classList.add("about-book");
  buttonContainer.classList.add("buttons-container");
  info.textContent = this.book.info();
  buttonContainer.appendChild(removeButton);
  buttonContainer.appendChild(readToggleButton);
  bookInfo.appendChild(buttonContainer);
  bookInfo.appendChild(info);
  this.associatedDiv.appendChild(bookInfo);
  return this;
}

let modalForm = (function() {
  const modal = document.getElementById("new-book-modal");
  const newBookBtn = document.getElementById("new-book");
  const closeSpan = document.getElementById("close-modal");
  const bookFields = Array.from(document.getElementsByClassName("book-field"));
  this.hideModal = function() {
    modal.style.display = "none";
    document.body.style.overflow = null;
  }
  this.restoreFields = function() {
    bookFields.forEach(bookField => {
      if(bookField.type === "text") {
        bookField.value = "";
      } else if(bookField.type === "checkbox") {
        bookField.checked = false;
      }
    });
  }
  this.restoreDefault = function() {
    restoreFields();
    hideModal();
  }
  return {
    init: function() {
      newBookBtn.addEventListener("click", function() {
        modal.style.display = "flex";
        document.body.style.overflow = "hidden";
      });
      closeSpan.addEventListener("click", function() {
        restoreDefault();
      });
      window.addEventListener("click", function(e) {
        if(e.target === modal) {
          restoreDefault();
        }
      });
    },
    get restoreFields() {
      return restoreFields;
    },
  }
})();

let cardCreator = (function() {
  this.alternateBackground = function(index) {
    return index % 2 == 0 ? "rgb(220, 220, 220)" : "rgb(235, 235, 235)";
  }
  return {
    createBookCard: function(book, bookRemover, readToggler) {
      const divCard = new Card(book).createBookPhoto().createBookInfo(bookRemover, readToggler).associatedDiv;
      divCard.classList.add("card");
      divCard.setAttribute("index", book.index);
      divCard.style.backgroundColor = alternateBackground(book.index);
      return divCard;
    },
  }
})();

let libraryApp = (function() {
  let library = [];
  let modal = modalForm;
  this.getBookFromModal = function() {
    const formElements = document.getElementById("form-modal").elements;
    const title = formElements.title.value;
    const author = formElements.author.value;
    const pages = formElements.pages.value;
    const imageLink = formElements.imageLink.value;
    const alreadyRead = formElements.alreadyRead.checked;
    return createBook(title, author, pages, imageLink, alreadyRead);
  }
  this.addBookToLibrary = function() {
    const book = getBookFromModal();
    library.push(book);
    modal.restoreFields();
    refreshBooksContainer();
  }
  this.removeBooks = function() {
    document.body.removeChild(document.getElementById("books-container"));
  }
  this.displayBooks = function() {
    const booksContainerDiv = document.createElement("div");
    booksContainerDiv.id = "books-container";
    let index = 0;
    library.forEach(book => {
      book.index = index;
      const divCard = cardCreator.createBookCard(book, this.removeBookFromLibrary, this.readToggle);
      booksContainerDiv.appendChild(divCard);
      index += 1;
    });
    document.body.appendChild(booksContainerDiv);
  }
  this.removeBookFromLibrary = function(e){
    const index = getBookIndex(e);
    library.splice(index, 1);
    refreshBooksContainer();
  }
  this.readToggle = function(e) {
    const index = getBookIndex(e);
    library[index].toggleRead();
    refreshBooksContainer();
  }
  this.refreshBooksContainer = function() {
    window.localStorage.setItem("library", JSON.stringify(library));
    this.removeBooks();
    this.displayBooks();
  }
  this.fetchLibraryFromLocalStorage = function() {
    const deserializedLibrary = JSON.parse(window.localStorage.getItem("library") || "[]");
    const associatedBooks = [];
    deserializedLibrary.forEach(book => {
      console.log("Book value: ", book);
      associatedBooks.push(createBook(book.title, book.author, book.pages, book.imageLink, book.alreadyRead));
    });
    return associatedBooks;
  }
  this.getBookIndex = function(e) {
    return e.currentTarget.parentNode.parentNode.parentNode.getAttribute("index");
  }
  return {
    init: function() {
      library = fetchLibraryFromLocalStorage();
      console.log("Library value: ", library);
      modalForm.init();
      if(library !== []) {
        displayBooks();
      }
      document.getElementById("submit-button").addEventListener("click", addBookToLibrary);
    },
  }
})();

libraryApp.init();
