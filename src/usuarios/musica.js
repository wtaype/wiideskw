import './musica.css';
import { getls, savels, Mensaje, wiSpin, showi } from '../widev.js';
import { db } from '../firebase.js';
import { doc, getDocs, setDoc, deleteDoc, collection, query, orderBy, limit, serverTimestamp, onSnapshot, where, updateDoc } from 'firebase/firestore';
import { rutas } from '../rutas.js';
import { linkweb } from '../wii.js';

// --- DATA ACCESS HELPERS ---
const wiUser = () => getls('wiSmile') || null;

const loadUserLikes = async (uid) => {
  if (!uid) return [];
  try {
    const snap = await getDocs(query(collection(db, 'wimusicaLikes'), where('userId', '==', uid)));
    if (snap.empty) return [];
    return snap.docs.map(d => d.data().trackId);
  } catch (e) {
    console.warn('Error loading favorites from Firestore:', e);
    return [];
  }
};

const saveMusicLike = async (user, track) => {
  const docId = `${user.usuario.trim().toLowerCase()}_${track.id.trim().toLowerCase()}`;
  const likeData = {
    id:          docId,
    usuario:     user.usuario.trim().toLowerCase(),
    email:       user.email,
    userId:      user.uid,
    trackId:     track.id,
    artista:     track.idioma || track.cantante || 'CumpleWii',
    poster:      track.poster || '',
    creado:      serverTimestamp(),
    actualizado: serverTimestamp()
  };
  await setDoc(doc(db, 'wimusicaLikes', docId), likeData);
};

const deleteMusicLike = async (user, trackId) => {
  const docId = `${user.usuario.trim().toLowerCase()}_${trackId.trim().toLowerCase()}`;
  await deleteDoc(doc(db, 'wimusicaLikes', docId));
};

// --- AUDIO LAYER AND STATE ---
let audio = null;
let tracks = [];
let likes = [];
let currentIndex = -1;
let isPlaying = false;
let loopMode = 'none'; // 'none', 'one', 'all'
let activeCat = 'todas'; // 'todas', 'animado', 'tradicional', 'favoritos'
let searchFilter = '';
let editandoId = null;
let unsubFirestore = null;
let eventListeners = [];
let smileUser = null;

const formatTime = (secs) => {
  if (isNaN(secs)) return '0:00';
  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const sortTracks = (all) => {
  const sorted = (a, b) => {
    return (b.pin ? 1 : 0) - (a.pin ? 1 : 0) || (b.creado?.seconds || 0) - (a.creado?.seconds || 0);
  };
  return [...all].sort(sorted);
};

const getFilteredTracks = () => {
  const q = searchFilter.toLowerCase().trim();
  return tracks.filter(c => {
    const matchesSearch = (`${c.titulo || ''} ${c.cantante || ''} ${c.idioma || ''}`).toLowerCase().includes(q);
    if (activeCat === 'todas') return matchesSearch;
    if (activeCat === 'favoritos') return likes.includes(c.id) && matchesSearch;
    return c.tag?.toLowerCase().trim() === activeCat.toLowerCase().trim() && matchesSearch;
  });
};

const listen = (target, type, handler, options = {}) => {
  if (!target) return;
  target.addEventListener(type, handler, options);
  eventListeners.push({ target, type, handler });
};

const renderList = () => {
  const listEl = document.getElementById('musPls');
  if (!listEl) return;

  const user = wiUser();
  const filtered = getFilteredTracks();

  // Suggest tags in form
  const tags = Array.from(new Set(tracks.map(c => c.tag).filter(Boolean))).slice(0, 8);
  const sugsEl = document.getElementById('catSugs');
  if (sugsEl) {
    sugsEl.innerHTML = tags.map(t => `<button type="button" class="cat sug_cat" style="padding:0.4vh 1.2vh; font-size:var(--fz_s3);">${t}</button>`).join('');
  }

  if (!filtered.length) {
    listEl.innerHTML = `
      <div class="mus_empty">
        <i class="fas fa-headphones"></i>
        <p>No se encontraron canciones</p>
      </div>`;
    return;
  }

  const currentActiveId = getls('musActual');

  listEl.innerHTML = filtered.map((c) => {
    const activa = currentActiveId === c.id;
    const isLiked = likes.includes(c.id);
    const cover = c.poster || (linkweb + '/smile.avif');
    return `
      <div class="mpi ${activa ? 'on' : ''} ${isLiked ? 'fav' : ''}" data-id="${c.id}">
        <div class="mpi_cov">
          <img src="${cover}" loading="lazy" alt="Carátula" onerror="this.src='/smile.avif'">
          <div class="mpi_ico">
            <i class="fas ${activa && isPlaying ? 'fa-pause' : 'fa-play'}"></i>
          </div>
        </div>
        <div class="mpi_info">
          <b>${c.titulo || ''}</b>
          <small>${c.idioma || c.cantante || 'Español'} ${c.tag ? `• ${c.tag.toUpperCase()}` : ''}</small>
        </div>
        <div class="mpi_acts">
          <button class="ma fav_t ${isLiked ? 'on' : ''}" data-id="${c.id}" title="Favorito">
            <i class="fas fa-heart"></i>
          </button>
        </div>
      </div>`;
  }).join('');
};

const loadTrack = (track) => {
  if (!audio || !track) return;

  audio.src = track.url;
  audio.load();

  // Update Player UI
  const actEl = document.getElementById('musActual');
  const artEl = document.getElementById('musArtista');
  const covEl = document.getElementById('musCover');
  const favEl = document.getElementById('musFav');

  if (actEl) actEl.textContent = track.titulo || '';
  if (artEl) artEl.textContent = track.idioma || track.cantante || 'Español';
  const cover = track.poster || (linkweb + '/smile.avif');
  if (covEl) covEl.src = cover;

  // Favorite button on player
  const isLiked = likes.includes(track.id);
  if (favEl) {
    favEl.classList.toggle('active', isLiked);
  }

  // Update active state in list
  document.querySelectorAll('.mpi').forEach(el => {
    el.classList.toggle('on', el.getAttribute('data-id') === track.id);
  });

  // Save current active track id
  savels('musActual', track.id, 168);

  const progressFill = document.getElementById('musProgressFill');
  if (progressFill) progressFill.style.width = '0%';
  const curEl = document.getElementById('musCur');
  if (curEl) curEl.textContent = '0:00';

  document.querySelectorAll('.mpi_ico i').forEach(ico => {
    ico.className = 'fas fa-play';
  });

  if (isPlaying) {
    audio.play().catch(err => console.warn('Playback error:', err));
  }
};

const playTrack = () => {
  if (!audio) return;
  
  const currentId = getls('musActual');
  let currentTrack = tracks.find(c => c.id === currentId);
  if (!currentTrack) {
    if (tracks.length > 0) {
      currentTrack = tracks[0];
      loadTrack(currentTrack);
    } else {
      Mensaje('No hay canciones en la lista', 'warning');
      return;
    }
  }

  const disc = document.getElementById('vinylDisc');
  const arm = document.getElementById('vinylArm');
  const eq = document.getElementById('musEqualizer');

  audio.play().then(() => {
    isPlaying = true;
    
    const playBtnI = document.querySelector('#musPlay i');
    if (playBtnI) playBtnI.className = 'fas fa-pause';
    
    if (disc) disc.classList.add('playing');
    if (arm) arm.classList.add('playing');
    if (eq) eq.classList.add('playing');

    // Update active playlist item icon
    const activePlayI = document.querySelector(`.mpi[data-id="${currentTrack.id}"] .mpi_ico i`);
    if (activePlayI) activePlayI.className = 'fas fa-pause';
  }).catch((err) => {
    console.error(err);
    Mensaje('Error al reproducir audio', 'error');
  });
};

const pauseTrack = () => {
  if (!audio) return;
  audio.pause();
  isPlaying = false;

  const playBtnI = document.querySelector('#musPlay i');
  if (playBtnI) playBtnI.className = 'fas fa-play';

  const disc = document.getElementById('vinylDisc');
  const arm = document.getElementById('vinylArm');
  const eq = document.getElementById('musEqualizer');
  if (disc) disc.classList.remove('playing');
  if (arm) arm.classList.remove('playing');
  if (eq) eq.classList.remove('playing');

  document.querySelectorAll('.mpi_ico i').forEach(ico => {
    ico.className = 'fas fa-play';
  });
};

const navigateTrack = (dir) => {
  if (!tracks.length) return;
  const currentId = getls('musActual');
  let index = tracks.findIndex(c => c.id === currentId);
  if (index === -1) index = 0;

  let nextIndex = index + dir;
  if (nextIndex < 0) nextIndex = tracks.length - 1;
  if (nextIndex >= tracks.length) nextIndex = 0;

  loadTrack(tracks[nextIndex]);
  playTrack();
};

const toggleLoopMode = () => {
  const repBtn = document.getElementById('musRep');
  if (!repBtn) return;

  if (loopMode === 'none') {
    loopMode = 'all';
    repBtn.classList.add('active');
    repBtn.innerHTML = '<i class="fas fa-redo-alt"></i>';
    Mensaje('Bucle: Todos', 'success');
  } else if (loopMode === 'all') {
    loopMode = 'one';
    repBtn.classList.add('active');
    repBtn.innerHTML = '<i class="fas fa-redo"></i>';
    Mensaje('Bucle: Uno', 'success');
  } else {
    loopMode = 'none';
    repBtn.classList.remove('active');
    repBtn.innerHTML = '<i class="fas fa-repeat"></i>';
    Mensaje('Bucle desactivado', 'success');
  }
  savels('musRep', loopMode, 168);
};

const cleanForm = () => {
  const form = document.getElementById('fmMusica');
  if (form) form.reset();

  editandoId = null;

  const fiId = document.getElementById('fiId');
  if (fiId) fiId.value = '';

  const fiNom = document.getElementById('fiNom');
  if (fiNom) fiNom.value = '';

  const fiUrl = document.getElementById('fiUrl');
  if (fiUrl) fiUrl.value = '';

  const fmTitle = document.getElementById('fmTitle');
  if (fmTitle) fmTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Compartir Canción';

  const saveBtnSpan = document.querySelector('#fmSave span');
  const saveBtnI = document.querySelector('#fmSave i');
  if (saveBtnSpan) saveBtnSpan.textContent = 'Guardar';
  if (saveBtnI) saveBtnI.className = 'fas fa-save';

  const btnDelete = document.getElementById('fmDelete');
  const btnNew = document.getElementById('fmNew');
  if (btnDelete) btnDelete.style.display = 'none';
  if (btnNew) btnNew.style.display = 'none';

  const badge = document.getElementById('musFormBadge');
  if (badge) {
    badge.innerHTML = `<span class="badge_nuevo"><i class="fas fa-plus"></i> NUEVA CANCIÓN</span>`;
  }

  // Set default values
  const fiPor = document.getElementById('fiPor');
  if (fiPor) fiPor.value = linkweb + '/smile.avif';

  const fiTag = document.getElementById('fiTag');
  if (fiTag) fiTag.value = 'Cumpleaños';

  const fiArt = document.getElementById('fiArt');
  if (fiArt) fiArt.value = 'Español';
};

const setupAudioListeners = () => {
  if (!audio) return;

  listen(audio, 'timeupdate', () => {
    if (!audio) return;
    const { currentTime: c, duration: d } = audio;
    const curEl = document.getElementById('musCur');
    const durEl = document.getElementById('musDur');
    const progressFill = document.getElementById('musProgressFill');
    const progressContainer = document.getElementById('musProgressBar');

    if (curEl) curEl.textContent = formatTime(c);
    if (durEl && d && !isNaN(d)) durEl.textContent = formatTime(d);
    if (progressFill && d && !isNaN(d) && d > 0) {
      progressFill.style.width = `${(c / d) * 100}%`;
    }
    if (progressContainer && d && !isNaN(d) && d > 0) {
      progressContainer.setAttribute('aria-valuenow', String(Math.round((c / d) * 100)));
    }
  });

  listen(audio, 'ended', () => {
    if (loopMode === 'one') {
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(err => console.warn(err));
      }
    } else {
      navigateTrack(1);
    }
  });

  listen(audio, 'loadedmetadata', () => {
    if (!audio) return;
    const durEl = document.getElementById('musDur');
    if (durEl) durEl.textContent = formatTime(audio.duration);
  });

  listen(audio, 'error', () => {
    Mensaje('Error de conexión con la pista', 'error');
  });
};

const setupEvents = () => {
  const user = wiUser();

  // 1. Play / Pause
  const playBtn = document.getElementById('musPlay');
  if (playBtn) {
    listen(playBtn, 'click', (e) => {
      e.stopPropagation();
      isPlaying ? pauseTrack() : playTrack();
    });
  }

  // 2. Navigation
  const prevBtn = document.getElementById('musPrev');
  if (prevBtn) {
    listen(prevBtn, 'click', (e) => {
      e.stopPropagation();
      navigateTrack(-1);
    });
  }

  const nextBtn = document.getElementById('musNext');
  if (nextBtn) {
    listen(nextBtn, 'click', (e) => {
      e.stopPropagation();
      navigateTrack(1);
    });
  }

  // 3. Repeat Toggle
  const repBtn = document.getElementById('musRep');
  if (repBtn) {
    listen(repBtn, 'click', (e) => {
      e.stopPropagation();
      toggleLoopMode();
    });
  }

  // 4. Mute / Unmute
  const muteBtn = document.getElementById('musMute');
  if (muteBtn) {
    listen(muteBtn, 'click', (e) => {
      e.stopPropagation();
      if (!audio) return;
      audio.muted = !audio.muted;
      const icon = muteBtn.querySelector('i');
      if (icon) {
        icon.className = `fas ${audio.muted ? 'fa-volume-xmark' : 'fa-volume-high'}`;
      }
      const volSlider = document.getElementById('musVolRange');
      if (volSlider) {
        volSlider.value = audio.muted ? '0' : String(audio.volume);
      }
    });
  }

  // 5. Volume Slider
  const volSlider = document.getElementById('musVolRange');
  if (volSlider) {
    listen(volSlider, 'input', (e) => {
      if (!audio) return;
      const val = parseFloat(e.target.value);
      audio.volume = val;
      audio.muted = val === 0;

      const icon = document.querySelector('#musMute i');
      if (icon) {
        icon.className = `fas ${val === 0 ? 'fa-volume-xmark' : val < 0.4 ? 'fa-volume-low' : 'fa-volume-high'}`;
      }
      savels('musVolume', val, 168);
    });
  }

  // 6. Seek Bar Progress
  const progBar = document.getElementById('musProgressBar');
  if (progBar) {
    listen(progBar, 'click', (e) => {
      if (!audio || !audio.duration || isNaN(audio.duration)) return;
      const rect = progBar.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      audio.currentTime = pct * audio.duration;
    });
  }

  // 7. Playlist Track Clicks
  const plsList = document.getElementById('musPls');
  if (plsList) {
    listen(plsList, 'click', async (e) => {
      const target = e.target;
      const favBtn = target.closest('.fav_t');

      // Click on favorite button
      if (favBtn) {
        e.stopPropagation();
        const id = favBtn.getAttribute('data-id');
        const c = tracks.find(x => x.id === id);
        if (!c) return;

        const isLiked = likes.includes(c.id);
        const newFav = !isLiked;

        // Optimistic UI updates
        favBtn.classList.toggle('on', newFav);
        const parentCard = favBtn.closest('.mpi');
        if (parentCard) parentCard.classList.toggle('fav', newFav);

        try {
          if (isLiked) {
            await deleteMusicLike(user, c.id);
            likes = likes.filter(id => id !== c.id);
          } else {
            await saveMusicLike(user, c);
            likes.push(c.id);
          }

          // Update player favorite button if same track
          const currentId = getls('musActual');
          if (currentId === c.id) {
            const playerFav = document.getElementById('musFav');
            if (playerFav) playerFav.classList.toggle('active', newFav);
          }

          renderList();
        } catch (err) {
          console.error(err);
          // Rollback
          favBtn.classList.toggle('on', isLiked);
          if (parentCard) parentCard.classList.toggle('fav', isLiked);
          Mensaje('Error al actualizar favoritos', 'error');
        }
        return;
      }

      // Play track click
      const item = target.closest('.mpi');
      if (!item) return;

      const id = item.getAttribute('data-id');
      const c = tracks.find(x => x.id === id);
      if (!c) return;

      const currentId = getls('musActual');
      if (currentId === c.id) {
        isPlaying ? pauseTrack() : playTrack();
      } else {
        loadTrack(c);
        playTrack();
      }

      // Check permissions to edit/delete
      const canEdit = user && (user.rol === 'admin' || user.rol === 'gestor' || (!c.email || c.email === user.email));
      if (canEdit) {
        editandoId = c.id;

        const fiNom = document.getElementById('fiNom');
        const fiArt = document.getElementById('fiArt');
        const fiUrl = document.getElementById('fiUrl');
        const fiPor = document.getElementById('fiPor');
        const fiTag = document.getElementById('fiTag');
        const fiId = document.getElementById('fiId');
        const fiFav = document.getElementById('fiFav');
        const fiPub = document.getElementById('fiPub');

        if (fiNom) fiNom.value = c.titulo || '';
        if (fiArt) fiArt.value = c.idioma || c.cantante || 'Español';
        if (fiUrl) fiUrl.value = c.url || '';
        if (fiPor) fiPor.value = c.poster || '';
        if (fiTag) fiTag.value = c.tag || '';
        if (fiId) fiId.value = c.id || '';
        if (fiFav) fiFav.checked = !!c.pin;
        if (fiPub) fiPub.checked = c.publico !== false;

        const fmTitle = document.getElementById('fmTitle');
        if (fmTitle) fmTitle.innerHTML = '<i class="fas fa-pen"></i> Editar Música';

        const saveBtnSpan = document.querySelector('#fmSave span');
        const saveBtnI = document.querySelector('#fmSave i');
        if (saveBtnSpan) saveBtnSpan.textContent = 'Actualizar';
        if (saveBtnI) saveBtnI.className = 'fas fa-pen';

        const btnDelete = document.getElementById('fmDelete');
        const btnNew = document.getElementById('fmNew');
        if (btnDelete) btnDelete.style.display = 'inline-flex';
        if (btnNew) btnNew.style.display = 'inline-flex';

        const badge = document.getElementById('musFormBadge');
        if (badge) {
          badge.innerHTML = `<span class="badge_editando"><i class="fas fa-pen"></i> EDITANDO: ${c.titulo}</span>`;
        }
      } else {
        cleanForm();
      }
    });
  }

  // 8. Player Favorite Button Click
  const playerFavBtn = document.getElementById('musFav');
  if (playerFavBtn) {
    listen(playerFavBtn, 'click', async (e) => {
      e.stopPropagation();
      const currentId = getls('musActual');
      const currentTrack = tracks.find(c => c.id === currentId);
      if (!currentTrack) return;

      const isLiked = likes.includes(currentTrack.id);
      const newFav = !isLiked;

      // Optimistic UI updates
      playerFavBtn.classList.toggle('active', newFav);
      
      const listCard = document.querySelector(`.mpi[data-id="${currentTrack.id}"]`);
      if (listCard) listCard.classList.toggle('fav', newFav);
      
      const listBtn = document.querySelector(`.fav_t[data-id="${currentTrack.id}"]`);
      if (listBtn) listBtn.classList.toggle('on', newFav);

      try {
        if (isLiked) {
          await deleteMusicLike(user, currentTrack.id);
          likes = likes.filter(id => id !== currentTrack.id);
        } else {
          await saveMusicLike(user, currentTrack);
          likes.push(currentTrack.id);
        }
        renderList();
      } catch (err) {
        console.error(err);
        playerFavBtn.classList.toggle('active', isLiked);
        if (listCard) listCard.classList.toggle('fav', isLiked);
        if (listBtn) listBtn.classList.toggle('on', isLiked);
        Mensaje('Error al actualizar favoritos', 'error');
      }
    });
  }

  // 9. Debounced search input
  const srcInput = document.getElementById('musSrc');
  if (srcInput) {
    let timer;
    listen(srcInput, 'input', () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        searchFilter = srcInput.value;
        renderList();
      }, 250);
    });
  }

  // 10. Category buttons clicks
  const catsContainer = document.getElementById('musCatsList');
  if (catsContainer) {
    listen(catsContainer, 'click', (e) => {
      const btn = e.target.closest('.cat');
      if (!btn) return;
      if (btn.classList.contains('sug_cat')) return;

      document.querySelectorAll('#musCatsList .cat').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');

      activeCat = btn.getAttribute('data-cat') || 'todas';
      renderList();
    });
  }

  // 11. Sugged tag click
  const sugsContainer = document.getElementById('catSugs');
  if (sugsContainer) {
    listen(sugsContainer, 'click', (e) => {
      const btn = e.target.closest('.sug_cat');
      if (!btn) return;
      const inputTag = document.getElementById('fiTag');
      if (inputTag) {
        inputTag.value = btn.textContent || '';
        inputTag.focus();
      }
    });
  }

  // 12. Clear Form Button (New)
  const newBtn = document.getElementById('fmNew');
  if (newBtn) {
    listen(newBtn, 'click', cleanForm);
  }

  // 13. Delete Song Button
  const delBtn = document.getElementById('fmDelete');
  if (delBtn) {
    listen(delBtn, 'click', async (e) => {
      e.stopPropagation();
      if (!editandoId) return;
      const c = tracks.find(x => x.id === editandoId);
      if (!c) return;

      const canEdit = user && (user.rol === 'admin' || user.rol === 'gestor' || (!c.email || c.email === user.email));
      if (!canEdit) {
        Mensaje('Sin permisos para eliminar esta canción', 'warning');
        return;
      }

      if (!confirm(`¿Estás seguro de eliminar "${c.titulo}"?`)) return;

      try {
        await deleteDoc(doc(db, 'wimusica', c.id));
        
        // Remove locally immediately for better feeling
        tracks = tracks.filter(x => x.id !== c.id);
        savels('wiMusica', tracks, 168);

        // Reset track if it was playing
        const currentId = getls('musActual');
        if (currentId === c.id) {
          pauseTrack();
          
          const actEl = document.getElementById('musActual');
          const artEl = document.getElementById('musArtista');
          const covEl = document.getElementById('musCover');
          if (actEl) actEl.textContent = 'Selecciona una canción';
          if (artEl) artEl.textContent = 'CumpleWii';
          if (covEl) covEl.src = '/smile.avif';
        }

        Mensaje('Música eliminada ✓', 'success');
        cleanForm();
        renderList();
      } catch (err) {
        console.error(err);
        Mensaje('Error al eliminar música', 'error');
      }
    });
  }

  // 14. Form Submit
  const form = document.getElementById('fmMusica');
  if (form) {
    listen(form, 'submit', async (e) => {
      e.preventDefault();
      if (!user) {
        Mensaje('Inicia sesión para realizar esta acción', 'warning');
        return;
      }

      const fiNom = document.getElementById('fiNom')?.value.trim();
      const fiArt = document.getElementById('fiArt')?.value.trim();
      const fiUrl = document.getElementById('fiUrl')?.value.trim();
      const fiPor = document.getElementById('fiPor')?.value.trim();
      const fiTag = document.getElementById('fiTag')?.value.trim();
      const fiFav = document.getElementById('fiFav')?.checked;
      const fiPub = document.getElementById('fiPub')?.checked;
      const fiId = document.getElementById('fiId')?.value || '';

      if (!fiNom || !fiArt || !fiUrl || !fiPor || !fiTag) {
        Mensaje('Completa todos los campos obligatorios', 'warning');
        return;
      }

      if (!fiUrl.toLowerCase().includes('.mp3')) {
        Mensaje('El enlace debe ser directo a un archivo .mp3', 'warning');
        return;
      }

      const payload = {
        titulo: fiNom,
        idioma: fiArt,
        url: fiUrl,
        poster: fiPor,
        tag: fiTag.toLowerCase().trim(),
        pin: !!fiFav,
        publico: fiPub !== false,
        email: user.email,
        userId: user.uid,
        usuario: user.usuario || user.nombre || 'CumpleWii',
        actualizado: serverTimestamp()
      };

      try {
        wiSpin('#fmSave', true);
        if (editandoId || fiId) {
          const targetId = editandoId || fiId;
          await updateDoc(doc(db, 'wimusica', targetId), payload);
          Mensaje('Música actualizada', 'success');
        } else {
          payload.creado = serverTimestamp();
          const docId = `music_${Date.now()}`;
          await setDoc(doc(db, 'wimusica', docId), { ...payload, id: docId });
          Mensaje('Música guardada ', 'success');
        }
        cleanForm();
      } catch (err) {
        console.error(err);
        Mensaje('Error al guardar música', 'error');
      } finally {
        wiSpin('#fmSave', false);
      }
    });
  }
};

export const render = () => {
  const user = wiUser();
  if (!user) { location.replace('/'); return ''; }

  const canUpload = !!user;

  return `
    <div class="mu_wrap wimusica">
      <div class="mus_body_grid ${canUpload ? 'autenticado' : ''}" id="musLayout">
        
        <!-- Columna Izquierda: Player + Playlist -->
        <div class="mus_left_col">
          <!-- REPRODUCTOR COMPACTO -->
          <div class="mus_player_wrap">
            <div class="mus_player compact_player" id="musPlayer">
              <!-- Tocadiscos de Vinilo -->
              <div class="vinyl_wrap">
                <div class="vinyl_disc" id="vinylDisc">
                  <img id="musCover" class="mus_cover" src="/smile.avif" alt="Portada de música" onerror="this.src='/smile.avif'">
                  <div class="vinyl_center"></div>
                </div>
                <div class="vinyl_arm" id="vinylArm"></div>
              </div>

              <!-- Lógica central del reproductor -->
              <div class="mus_pcore">
                <div class="mus_now_wrap">
                  <div class="mus_now">
                    <strong id="musActual">Selecciona una canción</strong>
                    <span id="musArtista">CumpleWii</span>
                  </div>
                  
                  <!-- Ondas del Ecualizador -->
                  <div class="mus_equalizer" id="musEqualizer">
                    <span class="eq_bar"></span>
                    <span class="eq_bar"></span>
                    <span class="eq_bar"></span>
                    <span class="eq_bar"></span>
                    <span class="eq_bar"></span>
                    <span class="eq_bar"></span>
                  </div>
                </div>

                <!-- Controles principales -->
                <div class="mus_ctrls">
                  <button class="mc" id="musPrev" title="Anterior"><i class="fas fa-backward-step"></i></button>
                  <button class="mc mc_play" id="musPlay" title="Reproducir / Pausar"><i class="fas fa-play"></i></button>
                  <button class="mc" id="musNext" title="Siguiente"><i class="fas fa-forward-step"></i></button>
                  <button class="mc" id="musRep" title="Repetir"><i class="fas fa-repeat"></i></button>
                  <button class="mc" id="musFav" title="Favorito"><i class="fas fa-heart"></i></button>
                </div>

                <!-- Barra de progreso -->
                <div class="mus_prog">
                  <span id="musCur">0:00</span>
                  <div class="mus_bar" id="musProgressBar" role="slider" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                    <div class="mus_fill" id="musProgressFill"></div>
                  </div>
                  <span id="musDur">0:00</span>
                </div>

                <!-- Control de Volumen -->
                <div class="mus_volume_wrap">
                  <button class="mc" id="musMute" title="Silenciar"><i class="fas fa-volume-high"></i></button>
                  <input type="range" id="musVolRange" min="0" max="1" step="0.05" value="0.8" class="mus_vol_slider" title="Ajustar Volumen">
                </div>
              </div>
            </div>
          </div>

          <!-- Biblioteca y listado -->
          <div class="mus_playlist_box" data-showi="80">
            <div class="mus_tools">
              <div class="mus_sbox">
                <i class="fas fa-search"></i>
                <input id="musSrc" placeholder="Buscar por título, cantante o etiqueta..." autocomplete="off">
              </div>
              <div class="mus_cats" id="musCatsList">
                <button class="cat active" data-cat="todas"><i class="fas fa-music"></i> Todas</button>
                <button class="cat" data-cat="animado"><i class="fas fa-bolt"></i> Animado</button>
                <button class="cat" data-cat="tradicional"><i class="fas fa-birthday-cake"></i> Tradicional</button>
                <button class="cat" data-cat="pop / rock"><i class="fas fa-guitar"></i> Pop / Rock</button>
                <button class="cat" data-cat="favoritos"><i class="fas fa-heart"></i> Favoritos</button>
              </div>
            </div>

            <!-- Listado de canciones -->
            <div id="musPls" class="mus_list">
              <div class="mus_skeleton"></div>
              <div class="mus_skeleton"></div>
              <div class="mus_skeleton"></div>
            </div>
          </div>
        </div>

        <!-- Columna Derecha: Formulario de Subida -->
        ${canUpload ? `
          <div class="mus_right" id="musRightPanel">
            <div class="mus_card">
              <h3 id="fmTitle"><i class="fas fa-plus-circle"></i> Compartir Canción</h3>
              
              <!-- Indicador de estado -->
              <div class="mus_badge" id="musFormBadge">
                <span class="badge_nuevo"><i class="fas fa-plus"></i> NUEVA CANCIÓN</span>
              </div>

              <form id="fmMusica" novalidate>
                <input type="hidden" class="fi_id" id="fiId">
                
                <!-- Grilla interna de dos columnas de campos -->
                <div class="fm_fields_grid">
                  <div class="fg">
                    <label for="fiNom">Título de la Música *</label>
                    <input class="fi fi_nom" id="fiNom" maxlength="100" placeholder="Ej. Cumpleaños Feliz" required>
                  </div>
                  <div class="fg">
                    <label for="fiArt">Idioma / Artista *</label>
                    <input class="fi fi_art" id="fiArt" maxlength="100" placeholder="Ej. Español" value="Español" required>
                  </div>
                  <div class="fg">
                    <label for="fiTag">Categoría / Etiqueta *</label>
                    <input class="fi fi_tag" id="fiTag" placeholder="Ej. cumpleaños, animado, pop / rock" value="Cumpleaños" required>
                    <div id="catSugs" class="mus_cats" style="margin-top: 1vh; gap: 0.6vh;"></div>
                  </div>
                  <div class="fg">
                    <label for="fiPor">URL de Imagen de Portada *</label>
                    <input type="url" class="fi fi_por" id="fiPor" placeholder="https://ejemplo.com/portada.jpg" value="${linkweb}/smile.avif" required>
                    <small>URL de imagen cuadrada preferentemente (500x500px)</small>
                  </div>
                  <div class="fg span_full">
                    <label for="fiUrl">URL de Audio (.mp3) *</label>
                    <input type="url" class="fi fi_url" id="fiUrl" placeholder="https://ejemplo.com/musica.mp3" required>
                    <small>Dirección URL directa a un archivo .mp3 público</small>
                  </div>
                </div>

                <div class="fchecks_row">
                  <label class="fck"><input type="checkbox" id="fiFav"><i class="fas fa-star" style="color: #ffc107;"></i> Destacar en la lista</label>
                  <label class="fck"><input type="checkbox" id="fiPub" checked><i class="fas fa-eye"></i> Pública para todos</label>
                </div>
                
                <div class="fbtns">
                  <button type="button" class="btn_sec" id="fmDelete" style="display:none;" title="Eliminar Música"><i class="fas fa-trash"></i></button>
                  <button type="button" class="btn_sec" id="fmNew" style="display:none;" title="Limpiar formulario"><i class="fas fa-plus"></i> Nuevo</button>
                  <button type="submit" class="btn_pri" id="fmSave"><i class="fas fa-save"></i> <span>Guardar</span></button>
                </div>
              </form>
            </div>
          </div>
        ` : ''}

      </div>
    </div>
  `;
};

export const init = async () => {
  const user = wiUser();
  if (!user) return rutas.navigate('/');

  smileUser = user;
  cleanup(); // Reset state

  // Load user likes
  likes = await loadUserLikes(user.uid);

  // Setup Audio element
  audio = new Audio();
  setupAudioListeners();

  const savedVol = getls('musVolume');
  const initialVol = savedVol !== null ? Number(savedVol) : 0.8;
  audio.volume = initialVol;
  audio.muted = initialVol === 0;

  const volSlider = document.getElementById('musVolRange');
  if (volSlider) volSlider.value = String(initialVol);

  const muteIcon = document.querySelector('#musMute i');
  if (muteIcon) {
    muteIcon.className = `fas ${initialVol === 0 ? 'fa-volume-xmark' : initialVol < 0.4 ? 'fa-volume-low' : 'fa-volume-high'}`;
  }

  const savedLoop = getls('musRep');
  if (savedLoop) {
    loopMode = savedLoop;
    const repBtn = document.getElementById('musRep');
    if (repBtn) {
      repBtn.classList.toggle('active', loopMode !== 'none');
      if (loopMode === 'one') repBtn.innerHTML = '<i class="fas fa-redo"></i>';
      else if (loopMode === 'all') repBtn.innerHTML = '<i class="fas fa-redo-alt"></i>';
    }
  }

  // Setup form fields state
  const canUpload = !!user;
  if (canUpload) {
    cleanForm();
  }

  // Setup UI Events
  setupEvents();

  // Load from local storage cache initially
  const cache = getls('wiMusica');
  if (cache && cache.length) {
    tracks = sortTracks(cache);
    renderList();

    const savedTrackId = getls('musActual');
    const savedTrack = tracks.find(x => x.id === savedTrackId);
    if (savedTrack) {
      loadTrack(savedTrack);
    } else if (tracks.length > 0) {
      loadTrack(tracks[0]);
    }
  }

  // Realtime Firestore Listener
  unsubFirestore = onSnapshot(collection(db, 'wimusica'), snap => {
    const all = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(c => c.publico !== false || c.email === user.email || user.rol === 'admin' || user.rol === 'gestor');
    tracks = sortTracks(all);
    savels('wiMusica', tracks, 168);
    renderList();

    // Auto load first song if none active
    const activeId = getls('musActual');
    if (tracks.length > 0) {
      const activeTrack = tracks.find(x => x.id === activeId);
      if (!activeTrack) {
        loadTrack(tracks[0]);
      } else {
        // Just sync active metadata
        const actEl = document.getElementById('musActual');
        const artEl = document.getElementById('musArtista');
        const covEl = document.getElementById('musCover');
        const favEl = document.getElementById('musFav');

        if (actEl) actEl.textContent = activeTrack.titulo;
        if (artEl) artEl.textContent = activeTrack.idioma || activeTrack.cantante || 'Español';
        const cover = activeTrack.poster || '/smile.avif';
        if (covEl) covEl.src = cover;
        
        const isLiked = likes.includes(activeTrack.id);
        if (favEl) {
          favEl.classList.toggle('active', isLiked);
        }
      }
    }
  }, err => {
    console.error('Firestore music listener error:', err);
    Mensaje('Error de sincronización con Firestore', 'error');
  });

  // Stagger entry animations
  showi('[data-showi]');
  console.log('Música Premium Inicializada');
};

export const cleanup = () => {
  eventListeners.forEach(({ target, type, handler }) => {
    if (target) target.removeEventListener(type, handler);
  });
  eventListeners = [];

  if (unsubFirestore) {
    unsubFirestore();
    unsubFirestore = null;
  }

  if (audio) {
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    audio = null;
  }
  currentIndex = -1;
  isPlaying = false;
};
