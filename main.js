// Do your work here...
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('bookForm').addEventListener('submit', function(event) {
      event.preventDefault();
      const id = Date.now(); // ID unik berdasarkan timestamp
      const title = document.getElementById('bookFormTitle').value;
      const author = document.getElementById('bookFormAuthor').value;
      const year = parseInt(document.getElementById('bookFormYear').value);
      const isComplete = document.getElementById('bookFormIsComplete').checked;
  
      const book = {
        id: id,
        title: title,
        author: author,
        year: year,
        isComplete: isComplete
      };
  
      addBookToLocalStorage(book);
      displayBooks();
    });
  
    function addBookToLocalStorage(book) {
      let books = JSON.parse(localStorage.getItem('books')) || [];
      books.push(book);
      localStorage.setItem('books', JSON.stringify(books));
    }
  
    function getBooksFromLocalStorage() {
      return JSON.parse(localStorage.getItem('books')) || [];
    }
  
    function displayBooks() {
      const books = getBooksFromLocalStorage();
      const incompleteBookList = document.getElementById('incompleteBookList');
      const completeBookList = document.getElementById('completeBookList');
      incompleteBookList.innerHTML = '';
      completeBookList.innerHTML = '';
  
      books.forEach(book => {
        const bookItem = document.createElement('div');
        bookItem.classList.add('book-entry'); 
        // bookItem.classList.add(book.isComplete ? 'selesai' : 'belum-selesai');
        bookItem.setAttribute('data-bookid', book.id);
        bookItem.setAttribute('data-testid', 'bookItem');
        bookItem.innerHTML = `
          <h3 data-testid="bookItemTitle">${book.title}</h3>
          <p data-testid="bookItemAuthor">Penulis: ${book.author}</p>
          <p data-testid="bookItemYear">Tahun: ${book.year}</p>
          <div>
            <button data-testid="bookItemIsCompleteButton">${book.isComplete ? 'Belum selesai dibaca' : 'Selesai dibaca'}</button>
            <button data-testid="bookItemDeleteButton">Hapus Buku</button>
            <button data-testid="bookItemEditButton">Edit Buku</button>
          </div>
        `;
  
        if (book.isComplete) {
          completeBookList.appendChild(bookItem);
        } else {
          incompleteBookList.appendChild(bookItem);
        }
  
        bookItem.querySelector('[data-testid="bookItemIsCompleteButton"]').addEventListener('click', function() {
          toggleBookCompletion(book.id);
        });
  
        bookItem.querySelector('[data-testid="bookItemDeleteButton"]').addEventListener('click', function() {
          deleteBook(book.id);
        });
  
        bookItem.querySelector('[data-testid="bookItemEditButton"]').addEventListener('click', function() {
          editBook(book.id);
        });
      });
    }
  
    function toggleBookCompletion(bookId) {
      let books = getBooksFromLocalStorage();
      books = books.map(book => {
        if (book.id === bookId) {
          book.isComplete = !book.isComplete;
        }
        return book;
      });
      localStorage.setItem('books', JSON.stringify(books));
      displayBooks();
    }
  
    function deleteBook(bookId) {
      let books = getBooksFromLocalStorage();
      books = books.filter(book => book.id !== bookId);
      localStorage.setItem('books', JSON.stringify(books));
      displayBooks();
    }
  
    // function editBook(bookId) {
    //   let books = getBooksFromLocalStorage();
    //   const book = books.find(book => book.id === bookId);
    //   if (book) {
    //     document.getElementById('bookFormTitle').value = book.title;
    //     document.getElementById('bookFormAuthor').value = book.author;
    //     document.getElementById('bookFormYear').value = book.year;
    //     document.getElementById('bookFormIsComplete').checked = book.isComplete;
  
    //     deleteBook(bookId);
    //   }
    // }
  
    displayBooks();
  });
  