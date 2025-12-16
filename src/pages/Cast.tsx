import { useEffect, useState } from 'react';
import { getCastMembers, CastMember } from '../lib/firebaseAdmin';
import '../styles/cast.css';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export default function Cast() {
    const [cast, setCast] = useState<CastMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDebug, setShowDebug] = useState(false);
    const [rawUsers, setRawUsers] = useState<any[] | null>(null);

    useEffect(() => {
        async function fetchCast() {
            try {
                setLoading(true);
                let data = await getCastMembers();
                // If no users found in the unified 'users' collection, fall back to legacy 'cast' collection
                if (!data || data.length === 0) {
                    const q = query(collection(db, 'cast'), where('visible', '==', true), orderBy('sortOrder', 'asc'));
                    const snap = await getDocs(q);
                    data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as CastMember[];
                }

                // Also fetch castPhotos and pick the most recent photo per castMemberId
                const photosSnap = await getDocs(collection(db, 'castPhotos'));
                const photoMap: Record<string, string> = {};
                photosSnap.docs.forEach((p) => {
                    const pd = p.data() as any;
                    if (pd.castMemberId && pd.url) {
                        // keep the first encountered (assume ordered by createdAt not guaranteed here)
                        if (!photoMap[pd.castMemberId]) photoMap[pd.castMemberId] = pd.url;
                    }
                });

                // attach preferred headshot from castPhotos when available
                const merged = (data || []).map((m) => ({ ...m, headshot: photoMap[m.id!] || (m as any).headshot || (m as any).headshot }));
                setCast(merged.filter((m) => m));
                console.debug('Cast fetched', { count: merged.length, members: merged.map(mm => ({ id: mm.id, name: ((mm as any).firstname || '') + ' ' + ((mm as any).lastname || '') || mm.name, headshot: (mm as any).headshot || (mm as any).headshot })) });
            } catch (err) {
                console.error('Failed to load cast members', err);
            } finally {
                setLoading(false);
            }
        }
        fetchCast();
    }, []);

    if (loading) return <div>Loading cast...</div>;

    return (
        <div>
            <div style={{ marginBottom: 12 }}>
                <button className="btn btn-small" onClick={() => setShowDebug((s) => !s)}>
                    {showDebug ? 'Hide' : 'Show'} Cast Debug ({cast.length})
                </button>
            </div>

            {showDebug && (
                <div style={{ background: '#f7f7f7', padding: 12, marginBottom: 12, borderRadius: 6, fontSize: 13 }}>
                    <div><strong>Total fetched:</strong> {cast.length}</div>
                    <div style={{ marginTop: 8 }}>
                        <button className="btn btn-small" onClick={async () => {
                            // fetch raw users collection to help debug role/fields
                            try {
                                const q = query(collection(db, 'users'));
                                const snap = await getDocs(q);
                                setRawUsers(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
                            } catch (err) {
                                console.error('Failed to fetch raw users', err);
                                setRawUsers(null);
                            }
                        }}>Fetch raw `users` docs</button>
                    </div>
                    <div style={{ marginTop: 8 }}>
                        {cast.map((m) => (
                            <div key={m.id} style={{ padding: '6px 0', borderBottom: '1px solid #eee' }}>
                                <div><strong>id:</strong> {m.id}</div>
                                <div><strong>name:</strong> {(m as any).firstname || (m as any).name || ''} {(m as any).lastname || ''}</div>
                                <div><strong>email:</strong> {(m as any).email}</div>
                                <div><strong>role:</strong> {(m as any).role || '—'}</div>
                                <div><strong>photo:</strong> {((m as any).headshot || (m as any).headshot) ? 'yes' : 'no'}</div>
                                <div style={{ fontSize: 12, color: '#666' }}>
                                    <em>raw headshot:</em> {(m as any).headshot || (m as any).headshot || '—'}
                                </div>
                            </div>
                        ))}
                    </div>
                    {rawUsers && (
                        <div style={{ marginTop: 12, background: '#fff', padding: 8, border: '1px solid #eee' }}>
                            <div><strong>Raw users count:</strong> {rawUsers.length}</div>
                            {rawUsers.map(u => (
                                <div key={u.id} style={{ padding: '6px 0', borderBottom: '1px solid #fafafa' }}>
                                    <div><strong>id:</strong> {u.id}</div>
                                    <div><strong>email:</strong> {u.email}</div>
                                    <div><strong>role:</strong> {u.role}</div>
                                    <div style={{ fontSize: 12, color: '#666' }}><em>raw:</em> {JSON.stringify(u)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="cast-gallery">
                {cast.map((member) => {
                    const preferredPhoto = (member as any).headshot || (member as any).headshot || null;
                    return (
                        <div className="cast-card" key={member.id}>
                            {preferredPhoto ? (
                                <img
                                    src={preferredPhoto}
                                    alt={((member as any).firstname || '') + ' ' + ((member as any).lastname || '') || member.name}
                                    onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="%23eee"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="20">No&nbsp;Photo</text></svg>';
                                    }}
                                />
                            ) : (
                                <div style={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eee', color: '#999' }}>
                                    No photo
                                </div>
                            )}
                            <h3>{((member as any).firstname ? ((member as any).firstname + ' ') : '') + ((member as any).lastname || member.name || '')}</h3>
                            <p className='cast-bio'>bio goes here :)</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}