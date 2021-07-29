function createBook(title, author, pages, imageLink, alreadyRead) {
  return {
    title,
    author,
    pages,
    imageLink,
    alreadyRead,
    toggleRead() {
      this.alreadyRead = !this.alreadyRead;
    },
    info() {
      const readValue = this.alreadyRead ? "already read" : "not read yet";
      return `${this.title} by ${this.author}, ${this.pages} pages, ${readValue}`;
    }
  };
}

function createCard(book) {
  let imageLink;
  let alt;
  [imageLink, alt] =
    (book.imageLink !== "" && isValidHttpUrl(book.imageLink)) ?
      [book.imageLink, `${book.title} book photo`] : ["/img/no-photo.jpg", "No photo provided photo"];
  function isValidHttpUrl(str) {
    let url;
    try {
      url = new URL(str);
    } catch (_) {
      return false;  
    }
    return url.protocol === "http:" || url.protocol === "https:";
  }
  function createButton(className, textContent, callback) {
    const removeButton = document.createElement("button");
    removeButton.classList.add(className);
    removeButton.textContent = textContent;
    removeButton.addEventListener("click", callback);
    return removeButton;
  }
  function setImage() {
    const img = document.createElement("img");
    img.src = imageLink;
    img.alt = alt;
    return img;
  }
  function setBookPhoto(div) {
    const bookPhoto = document.createElement("div");
    const img = setImage();
    bookPhoto.classList = "book-photo";
    bookPhoto.appendChild(img);
    div.appendChild(bookPhoto);
    return div;
  }
  function setBookInfo(div, bookRemover, readToggler) {
    const bookInfo = document.createElement("div");
    const info = document.createElement("div");
    const removeButton = createButton("remove-button", "Remove", bookRemover);
    const buttonContainer = document.createElement("div");
    const readToggleButton = createButton("read-toggle", "Toggle Read", readToggler);
    bookInfo.classList.add("book-info");
    info.classList.add("about-book");
    buttonContainer.classList.add("buttons-container");
    info.textContent = book.info();
    buttonContainer.appendChild(removeButton);
    buttonContainer.appendChild(readToggleButton);
    bookInfo.appendChild(buttonContainer);
    bookInfo.appendChild(info);
    div.appendChild(bookInfo);
    return div;
  }
  return {
    book,
    imageLink,
    alt,
    createDivCard(bookRemover, readToggler) {
      const alternateBackground = (index) => {
        return index % 2 == 0 ? "rgb(220, 220, 220)" : "rgb(235, 235, 235)";
      };
      const div = document.createElement("div");
      setBookPhoto(div);
      setBookInfo(div, bookRemover, readToggler);
      div.classList.add("card");
      div.setAttribute("index", book.index);
      div.style.backgroundColor = alternateBackground(book.index);
      return div;
    }
  };
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
      const divCard = createCard(book).createDivCard(this.removeBookFromLibrary, this.readToggle);
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
      modalForm.init();
      if(library !== []) {
        displayBooks();
      }
      document.getElementById("submit-button").addEventListener("click", addBookToLibrary);
    },
  }
})();

libraryApp.init();
