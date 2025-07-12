const BACKEND_URL = 'http://localhost:9000'; // Pastikan ini sesuai dengan port server backend Anda!

document.addEventListener('DOMContentLoaded', function() {
    // Event Listener untuk form tambah buku
    document.getElementById('bookForm').addEventListener('submit', async function(event) {
        event.preventDefault(); // Mencegah refresh halaman
        
        // Ambil data dari form HTML yang sudah direvisi
        const name = document.getElementById('bookFormTitle').value;
        const author = document.getElementById('bookFormAuthor').value;
        const year = parseInt(document.getElementById('bookFormYear').value);
        const summary = document.getElementById('bookFormSummary').value;
        const publisher = document.getElementById('bookFormPublisher').value;
        const pageCount = parseInt(document.getElementById('bookFormPageCount').value);
        const readPage = parseInt(document.getElementById('bookFormReadPage').value);
        const reading = document.getElementById('bookFormReading').checked; // Langsung map ke 'reading' di backend

        // Validasi dasar di frontend (sesuai dengan handler backend)
        if (!name) {
            alert('Gagal menambahkan buku. Mohon isi nama buku');
            return;
        }
        if (readPage > pageCount) {
            alert('Gagal menambahkan buku. readPage tidak boleh lebih besar dari pageCount');
            return;
        }

        const bookData = {
            name, year, author, summary, publisher, pageCount, readPage, reading
        };

        try {
            // Kirim data ke backend menggunakan POST /books
            const response = await fetch(`${BACKEND_URL}/books`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bookData),
            });
            const result = await response.json(); // Parsing respons JSON dari backend

            if (result.status === 'success') {
                alert(result.message);
                event.target.reset(); // Reset form setelah berhasil
                displayBooks(); // Muat ulang daftar buku
            } else {
                alert(`Gagal menambahkan buku: ${result.message}`);
            }
        } catch (error) {
            console.error('Error adding book:', error);
            alert('Terjadi kesalahan saat menambahkan buku. Pastikan server backend berjalan.');
        }
    });

    // Event Listener untuk form cari buku
    document.getElementById('searchBook').addEventListener('submit', async function(event) {
        event.preventDefault();
        const searchTerm = document.getElementById('searchBookTitle').value;
        displayBooks(searchTerm); // Panggil fungsi displayBooks dengan searchTerm
    });

    // Fungsi untuk menampilkan buku
    async function displayBooks(searchTerm = '') {
        const incompleteBookList = document.getElementById('incompleteBookList');
        const completeBookList = document.getElementById('completeBookList');
        incompleteBookList.innerHTML = ''; // Bersihkan daftar
        completeBookList.innerHTML = '';   // Bersihkan daftar

        try {
            let url = `${BACKEND_URL}/books`;
            if (searchTerm) {
                // Tambahkan parameter query 'name' jika ada searchTerm
                url += `?name=${encodeURIComponent(searchTerm)}`;
            }

            // Ambil semua buku dari backend menggunakan GET /books
            const response = await fetch(url);
            const result = await response.json();

            if (result.status === 'success' && result.data && result.data.books) {
                const books = result.data.books;
                if (books.length === 0) {
                    incompleteBookList.innerHTML = '<p>Belum ada buku.</p>';
                    completeBookList.innerHTML = '<p>Belum ada buku.</p>';
                }
                
                books.forEach(book => {
                    const bookItem = document.createElement('div');
                    bookItem.classList.add('book-entry'); 
                    bookItem.setAttribute('data-bookid', book.id);
                    bookItem.setAttribute('data-testid', 'bookItem');
                    bookItem.innerHTML = `
                        <h3 data-testid="bookItemTitle">${book.name}</h3>
                        <p data-testid="bookItemAuthor">Penulis: ${book.author}</p>
                        <p data-testid="bookItemYear">Tahun: ${book.year}</p>
                        <p>Penerbit: ${book.publisher}</p>
                        <p>Halaman: ${book.readPage} dari ${book.pageCount}</p>
                        <div>
                            <button data-testid="bookItemIsCompleteButton">${book.finished ? 'Belum selesai dibaca' : 'Selesai dibaca'}</button>
                            <button data-testid="bookItemDeleteButton">Hapus Buku</button>
                            <button data-testid="bookItemEditButton">Edit Buku</button>
                        </div>
                    `;
        
                    if (book.finished) { // Menggunakan properti 'finished' dari backend
                        completeBookList.appendChild(bookItem);
                    } else {
                        incompleteBookList.appendChild(bookItem);
                    }
        
                    // Event listener untuk tombol Selesai/Belum Selesai dibaca
                    bookItem.querySelector('[data-testid="bookItemIsCompleteButton"]').addEventListener('click', function() {
                        toggleBookCompletion(book.id, book.finished); // Pass current finished status
                    });
        
                    // Event listener untuk tombol Hapus
                    bookItem.querySelector('[data-testid="bookItemDeleteButton"]').addEventListener('click', function() {
                        deleteBook(book.id);
                    });

                    // Event listener untuk tombol Edit
                    bookItem.querySelector('[data-testid="bookItemEditButton"]').addEventListener('click', function() {
                        editBook(book.id);
                    });
                });
            } else if (result.status === 'fail') {
                console.error('Failed to fetch books:', result.message);
                incompleteBookList.innerHTML = `<p>Gagal memuat buku: ${result.message}</p>`;
                completeBookList.innerHTML = `<p>Gagal memuat buku: ${result.message}</p>`;
            }
        } catch (error) {
            console.error('Error fetching books:', error);
            incompleteBookList.innerHTML = '<p>Terjadi kesalahan saat memuat buku. Pastikan server backend berjalan.</p>';
            completeBookList.innerHTML = '<p>Terjadi kesalahan saat memuat buku. Pastikan server backend berjalan.</p>';
        }
    }
    
    // Fungsi untuk mengubah status selesai/belum selesai membaca buku
    async function toggleBookCompletion(bookId, currentFinishedStatus) {
        try {
            // 1. Ambil detail buku saat ini dari backend (GET /books/{bookId})
            const getResponse = await fetch(`${BACKEND_URL}/books/${bookId}`);
            const getResult = await getResponse.json();
    
            if (getResult.status !== 'success' || !getResult.data.book) {
                alert(`Gagal mengambil detail buku untuk diubah: ${getResult.message || 'Buku tidak ditemukan'}`);
                return;
            }
    
            const book = getResult.data.book;
            let updatedBookData = { ...book }; // Salin data buku yang ada
    
            // 2. Modifikasi properti yang relevan (readPage, reading) untuk mengubah status 'finished'
            if (currentFinishedStatus) { // Jika saat ini sudah selesai, ubah menjadi belum selesai
                updatedBookData.readPage = 0; // Halaman dibaca diatur ke 0
                updatedBookData.reading = true; // Status membaca diatur ke true
            } else { // Jika saat ini belum selesai, ubah menjadi selesai
                updatedBookData.readPage = updatedBookData.pageCount; // Halaman dibaca diatur sama dengan total halaman
                updatedBookData.reading = false; // Status membaca diatur ke false
            }
            
            // Hapus properti yang tidak boleh ada di payload PUT (id, insertedAt, updatedAt)
            delete updatedBookData.id;
            delete updatedBookData.insertedAt;
            delete updatedBookData.updatedAt;
    
            // 3. Kirim data yang diperbarui ke backend menggunakan PUT /books/{bookId}
            const putResponse = await fetch(`${BACKEND_URL}/books/${bookId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedBookData)
            });
            const putResult = await putResponse.json();
    
            if (putResult.status === 'success') {
                alert(putResult.message);
                displayBooks(); // Muat ulang daftar buku
            } else {
                alert(`Gagal memperbarui status buku: ${putResult.message}`);
            }
        } catch (error) {
            console.error('Error toggling book completion:', error);
            alert('Terjadi kesalahan saat mengubah status buku. Pastikan server backend berjalan.');
        }
    }
    
    // Fungsi untuk menghapus buku
    async function deleteBook(bookId) {
        if (!confirm('Apakah Anda yakin ingin menghapus buku ini?')) {
            return;
        }
    
        try {
            // Kirim permintaan DELETE ke backend /books/{bookId}
            const response = await fetch(`${BACKEND_URL}/books/${bookId}`, {
                method: 'DELETE'
            });
            const result = await response.json();
    
            if (result.status === 'success') {
                alert(result.message);
                displayBooks(); // Muat ulang daftar buku
            } else {
                alert(`Gagal menghapus buku: ${result.message}`);
            }
        } catch (error) {
            console.error('Error deleting book:', error);
            alert('Terjadi kesalahan saat menghapus buku. Pastikan server backend berjalan.');
        }
    }
    
    // Fungsi untuk mengedit buku (lebih kompleks, perlu menampilkan form/modal)
    // Untuk tujuan tutorial ini, kita akan mengisi form tambah buku dengan data yang akan diedit
    async function editBook(bookId) {
        try {
            // 1. Ambil detail buku dari backend (GET /books/{bookId})
            const response = await fetch(`${BACKEND_URL}/books/${bookId}`);
            const result = await response.json();
    
            if (result.status === 'success' && result.data.book) {
                const bookToEdit = result.data.book;
                
                // Isi form tambah buku dengan data buku yang akan diedit
                document.getElementById('bookFormTitle').value = bookToEdit.name;
                document.getElementById('bookFormAuthor').value = bookToEdit.author;
                document.getElementById('bookFormYear').value = bookToEdit.year;
                document.getElementById('bookFormSummary').value = bookToEdit.summary;
                document.getElementById('bookFormPublisher').value = bookToEdit.publisher;
                document.getElementById('bookFormPageCount').value = bookToEdit.pageCount;
                document.getElementById('bookFormReadPage').value = bookToEdit.readPage;
                document.getElementById('bookFormReading').checked = bookToEdit.reading;
    
                // Ubah teks tombol submit menjadi "Perbarui Buku"
                document.getElementById('bookFormSubmit').innerHTML = 'Perbarui Buku';
    
                // Simpan ID buku yang sedang diedit di form (data-attribute)
                document.getElementById('bookForm').dataset.editingId = bookId;
    
                alert('Form telah diisi dengan data buku. Silakan ubah dan klik "Perbarui Buku".');
    
                // Tambahkan atau modifikasi event listener submit untuk menangani UPDATE
                // Ini akan menggantikan event listener submit yang ada jika ini adalah operasi edit.
                // Pendekatan yang lebih bersih adalah menggunakan modal/popup terpisah untuk edit.
                document.getElementById('bookForm').removeEventListener('submit', arguments.callee); // Hapus listener lama jika ada
                document.getElementById('bookForm').addEventListener('submit', async function updateHandler(e) {
                    e.preventDefault();
                    const currentEditingId = e.target.dataset.editingId;
                    if (!currentEditingId) return; // Pastikan ada ID yang diedit

                    const updatedName = document.getElementById('bookFormTitle').value;
                    const updatedAuthor = document.getElementById('bookFormAuthor').value;
                    const updatedYear = parseInt(document.getElementById('bookFormYear').value);
                    const updatedSummary = document.getElementById('bookFormSummary').value;
                    const updatedPublisher = document.getElementById('bookFormPublisher').value;
                    const updatedPageCount = parseInt(document.getElementById('bookFormPageCount').value);
                    const updatedReadPage = parseInt(document.getElementById('bookFormReadPage').value);
                    const updatedReading = document.getElementById('bookFormReading').checked;

                    // Validasi seperti saat menambah buku
                    if (!updatedName) {
                        alert('Gagal memperbarui buku. Mohon isi nama buku');
                        return;
                    }
                    if (updatedReadPage > updatedPageCount) {
                        alert('Gagal memperbarui buku. readPage tidak boleh lebih besar dari pageCount');
                        return;
                    }

                    const updatedBookPayload = {
                        name: updatedName,
                        year: updatedYear,
                        author: updatedAuthor,
                        summary: updatedSummary,
                        publisher: updatedPublisher,
                        pageCount: updatedPageCount,
                        readPage: updatedReadPage,
                        reading: updatedReading
                    };

                    try {
                        // Kirim data yang diperbarui ke backend menggunakan PUT /books/{bookId}
                        const putResponse = await fetch(`${BACKEND_URL}/books/${currentEditingId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(updatedBookPayload)
                        });
                        const putResult = await putResponse.json();

                        if (putResult.status === 'success') {
                            alert(putResult.message);
                            e.target.reset(); // Reset form
                            delete e.target.dataset.editingId; // Hapus ID yang diedit
                            document.getElementById('bookFormSubmit').innerHTML = 'Masukkan Buku ke Rak <span>Belum selesai dibaca</span>'; // Kembalikan teks tombol
                            displayBooks(); // Muat ulang daftar buku
                        } else {
                            alert(`Gagal memperbarui buku: ${putResult.message}`);
                        }
                    } catch (error) {
                        console.error('Error updating book:', error);
                        alert('Terjadi kesalahan saat memperbarui buku. Pastikan server backend berjalan.');
                    }
                    // Hapus event listener ini setelah selesai, agar tidak menumpuk
                    e.target.removeEventListener('submit', updateHandler);
                    // Pasang kembali event listener ADD asli
                    document.getElementById('bookForm').addEventListener('submit', arguments.callee);
                });


            } else {
                alert(`Gagal mengambil data buku untuk diedit: ${result.message}`);
            }
        } catch (error) {
            console.error('Error fetching book for edit:', error);
            alert('Terjadi kesalahan saat mengambil data buku untuk diedit. Pastikan server backend berjalan.');
        }
    }
    
    // Panggil fungsi displayBooks saat halaman dimuat pertama kali
    displayBooks();
});