import React, { useState, useRef } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonIcon,
  IonFab,
  IonFabButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonRow,
  IonCol,
  IonText,
  IonMenuButton,
  IonSearchbar,
  IonModal,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonList,
  IonItem,
  IonNote,
  useIonAlert,
} from "@ionic/react";
import {
  addOutline,
  searchOutline,
  footballOutline,
  locationOutline,
  homeOutline,
  sunnyOutline,
  personOutline,
  calendarOutline,
  arrowBackOutline,
} from "ionicons/icons";
import { RefresherEventDetail } from "@ionic/core";
import {
  useCourts,
  useCourt,
  usePublicCourts,
  useCreateCourt,
  useUpdateCourt,
  useDeleteCourt,
} from "../hooks/useCourts";
import {
  usePublicCourtSchedules,
  useCreateCourtSchedule,
  useUpdateCourtSchedule,
  useDeleteCourtSchedule,
} from "../hooks/useCourtSchedules";
import { useProfile } from "../hooks/useRealtimeData";
import { useAppToast } from "../hooks/useAppToast";
import { AppToast } from "../components/common/AppToast";
import { CourtCard } from "../components/courts/CourtCard";
import { CourtFormContent } from "../components/courts/CourtFormModal";
import { ScheduleFormContent } from "../components/courts/ScheduleFormContent";
import { ScheduleListCard } from "../components/courts/ScheduleListCard";
import type { Court, CourtSchedule } from "../interfaces";
import type { CourtFormData } from "../schemas/court.schemas";
import type { CourtScheduleFormData } from "../schemas/courtSchedule.schemas";

type ViewMode = "auth" | "public";

const Courts: React.FC = () => {
  // ── Estado ──
  const [viewMode, setViewMode] = useState<ViewMode>("auth");
  const [searchText, setSearchText] = useState("");
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [selectedCourtId, setSelectedCourtId] = useState<number | null>(null);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<CourtSchedule | null>(
    null,
  );
  const [scheduleCourtId, setScheduleCourtId] = useState<number | null>(null);
  const [scheduleCourtName, setScheduleCourtName] = useState<string>("");
  const [presentAlert] = useIonAlert();

  // ── Refs para modales (API imperativa — más confiable dentro de IonTabs) ──
  const formModalRef = useRef<HTMLIonModalElement>(null);
  const detailModalRef = useRef<HTMLIonModalElement>(null);
  const scheduleModalRef = useRef<HTMLIonModalElement>(null);

  // ── Queries ──
  const { data: user } = useProfile();
  const {
    data: courts,
    isLoading: loadingCourts,
    refetch: refetchCourts,
  } = useCourts();
  const {
    data: publicCourts,
    isLoading: loadingPublic,
    refetch: refetchPublic,
  } = usePublicCourts();
  const { data: selectedCourt, isLoading: loadingDetail } = useCourt(
    selectedCourtId ?? 0,
  );

  // ── Mutations ──
  const createMutation = useCreateCourt();
  const updateMutation = useUpdateCourt();
  const deleteMutation = useDeleteCourt();

  // ── Schedules ──
  const { data: courtSchedules, isLoading: loadingSchedules } =
    usePublicCourtSchedules(selectedCourtId ?? undefined);
  const createScheduleMutation = useCreateCourtSchedule();
  const updateScheduleMutation = useUpdateCourtSchedule();
  const deleteScheduleMutation = useDeleteCourtSchedule();

  // ── Toast ──
  const { toast, showError, showSuccess, dismissToast } = useAppToast();

  // ── Derived ──
  const isLoading = viewMode === "auth" ? loadingCourts : loadingPublic;
  const currentCourts = viewMode === "auth" ? courts : publicCourts;
  const userId = user?.id ?? 0;

  // ── Filtrar por búsqueda ──
  const filteredCourts = (currentCourts ?? []).filter((court) => {
    if (!searchText.trim()) return true;
    const q = searchText.toLowerCase();
    return (
      court.name.toLowerCase().includes(q) ||
      court.location.toLowerCase().includes(q) ||
      court.User?.username?.toLowerCase().includes(q)
    );
  });

  // ── Handlers ──
  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    if (viewMode === "auth") {
      await refetchCourts();
    } else {
      await refetchPublic();
    }
    event.detail.complete();
  };

  const handleCreate = () => {
    setEditingCourt(null);
    formModalRef.current?.present();
  };

  const handleEdit = (court: Court) => {
    setEditingCourt(court);
    // Pequeño delay para que el state se setee antes de abrir el modal
    setTimeout(() => formModalRef.current?.present(), 50);
  };

  const handleDelete = (court: Court) => {
    presentAlert({
      header: "Desactivar Cancha",
      message: `¿Estás seguro de desactivar "${court.name}"?`,
      buttons: [
        { text: "Cancelar", role: "cancel" },
        {
          text: "Desactivar",
          role: "destructive",
          handler: async () => {
            try {
              await deleteMutation.mutateAsync(court.id);
              showSuccess(`"${court.name}" desactivada correctamente`);
            } catch (error) {
              showError(error);
            }
          },
        },
      ],
    });
  };

  const handleViewDetail = (court: Court) => {
    setSelectedCourtId(court.id);
    setTimeout(() => detailModalRef.current?.present(), 50);
  };

  const handleFormSubmit = async (data: CourtFormData) => {
    // Construir payload limpio compatible con CourtInput
    const payload = {
      name: data.name.trim(),
      location: data.location.trim(),
      userId: data.userId || userId, // fallback al user actual
      isIndoor: data.isIndoor ?? false,
      active: data.active ?? true,
      ...(data.latitude != null ? { latitude: data.latitude } : {}),
      ...(data.longitude != null ? { longitude: data.longitude } : {}),
    };

    console.debug("[Courts] Enviando payload:", JSON.stringify(payload));

    try {
      if (editingCourt) {
        await updateMutation.mutateAsync({
          id: editingCourt.id,
          data: payload,
        });
        showSuccess(`"${data.name}" actualizada correctamente`);
      } else {
        await createMutation.mutateAsync(payload);
        showSuccess(`"${data.name}" creada correctamente`);
      }
      formModalRef.current?.dismiss();
      setEditingCourt(null);
    } catch (error: unknown) {
      console.error("[Courts] Error al guardar cancha:", error);
      // Intentar extraer mensaje útil del error
      const msg =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : typeof error === "object" && error !== null
              ? (error as any).message ||
                (error as any).error ||
                JSON.stringify(error)
              : "Error desconocido al guardar la cancha";
      showError(
        msg === "{}" || !msg
          ? "No se pudo guardar la cancha. Verifica la conexión y los datos."
          : msg,
      );
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isScheduleSubmitting =
    createScheduleMutation.isPending || updateScheduleMutation.isPending;

  // ── Schedule Handlers ──
  const handleScheduleAdd = (courtId: number, courtName: string) => {
    setEditingSchedule(null);
    setScheduleCourtId(courtId);
    setScheduleCourtName(courtName);
    scheduleModalRef.current?.present();
  };

  const handleScheduleEdit = (schedule: CourtSchedule) => {
    setEditingSchedule(schedule);
    setScheduleCourtId(schedule.courtId);
    setScheduleCourtName("");
    setTimeout(() => scheduleModalRef.current?.present(), 50);
  };

  const handleScheduleToggleActive = (schedule: CourtSchedule) => {
    const newState = !schedule.active;
    updateScheduleMutation.mutate(
      { id: schedule.id, data: { active: newState } },
      {
        onSuccess: () =>
          showSuccess(
            `Horario ${newState ? "activado" : "desactivado"} correctamente`,
          ),
        onError: (err) => showError(err),
      },
    );
  };

  const handleScheduleDelete = (schedule: CourtSchedule) => {
    presentAlert({
      header: "Eliminar Horario",
      message: `¿Eliminar este horario?`,
      buttons: [
        { text: "Cancelar", role: "cancel" },
        {
          text: "Eliminar",
          role: "destructive",
          handler: async () => {
            try {
              await deleteScheduleMutation.mutateAsync(schedule.id);
              showSuccess("Horario eliminado correctamente");
            } catch (error) {
              showError(error);
            }
          },
        },
      ],
    });
  };

  const handleScheduleFormSubmit = async (data: CourtScheduleFormData) => {
    try {
      if (editingSchedule) {
        await updateScheduleMutation.mutateAsync({
          id: editingSchedule.id,
          data,
        });
        showSuccess("Horario actualizado correctamente");
      } else {
        await createScheduleMutation.mutateAsync(data as any);
        showSuccess("Horario creado correctamente");
      }
      scheduleModalRef.current?.dismiss();
      setEditingSchedule(null);
    } catch (error) {
      showError(error);
    }
  };

  return (
    <IonPage>
      {/* ── Header ── */}
      <IonHeader className="fb-header">
        <IonToolbar>
          <IonTitle slot="start" className="fb-logo-text">
            Canchas
          </IonTitle>
          <IonButtons slot="end">
            <IonMenuButton className="fb-header-btn" autoHide={false} />
          </IonButtons>
        </IonToolbar>

        {/* Segmento Auth / Público */}
        <IonToolbar
          style={{
            "--background": "var(--ion-toolbar-background)",
            "--border-width": "0",
            paddingBottom: "4px",
          }}
        >
          <IonSegment
            value={viewMode}
            onIonChange={(e) => {
              const val = e.detail.value;
              if (val === "auth" || val === "public") {
                setViewMode(val);
                setSearchText("");
              }
            }}
            mode="ios"
            style={{
              maxWidth: "340px",
              margin: "0 auto",
              "--background": "var(--ion-color-light)",
              borderRadius: "10px",
            }}
          >
            <IonSegmentButton value="auth">
              <IonLabel style={{ fontSize: "13px", fontWeight: 600 }}>
                Mis Canchas
              </IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="public">
              <IonLabel style={{ fontSize: "13px", fontWeight: 600 }}>
                Públicas
              </IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent
            pullingText="Desliza para actualizar"
            refreshingSpinner="crescent"
            refreshingText="Actualizando..."
          />
        </IonRefresher>

        {/* Barra de búsqueda mejorada */}
        <div style={{ padding: "10px 14px 0" }}>
          <IonSearchbar
            value={searchText}
            onIonInput={(e) => setSearchText(e.detail.value ?? "")}
            placeholder={
              viewMode === "auth"
                ? "Buscar en mis canchas..."
                : "Buscar canchas públicas..."
            }
            debounce={250}
            animated
            showClearButton="focus"
            mode="ios"
            style={{
              "--background": "var(--ion-color-light)",
              "--border-radius": "12px",
              "--box-shadow": "none",
              "--icon-color": "var(--ion-color-medium)",
              "--placeholder-color": "var(--ion-color-medium)",
              padding: "0",
              minHeight: "40px",
            }}
          />
        </div>

        {/* Loading */}
        {isLoading && (
          <IonRow
            className="ion-justify-content-center ion-align-items-center"
            style={{ height: "40vh" }}
          >
            <IonSpinner name="crescent" />
          </IonRow>
        )}

        {/* Contador */}
        {!isLoading && currentCourts && (
          <IonRow
            className="ion-align-items-center"
            style={{ padding: "6px 18px 2px", gap: "6px" }}
          >
            <IonText
              style={{ fontSize: "13px", color: "var(--ion-color-medium)" }}
            >
              {filteredCourts.length}{" "}
              {filteredCourts.length === 1 ? "cancha" : "canchas"}{" "}
              {searchText.trim() ? "encontradas" : "disponibles"}
            </IonText>
            {viewMode === "public" && (
              <IonChip
                style={{
                  fontSize: "10px",
                  height: "20px",
                  margin: 0,
                  "--background": "rgba(66,183,42,0.10)",
                  "--color": "var(--ion-color-success)",
                }}
              >
                Solo activas
              </IonChip>
            )}
          </IonRow>
        )}

        {/* Lista vacía */}
        {!isLoading && filteredCourts.length === 0 && (
          <IonRow
            className="ion-justify-content-center ion-align-items-center ion-text-center"
            style={{
              height: "40vh",
              flexDirection: "column",
              gap: "12px",
              padding: "0 32px",
            }}
          >
            <IonIcon
              icon={footballOutline}
              style={{
                fontSize: "64px",
                color: "var(--ion-color-medium)",
                opacity: 0.4,
              }}
            />
            <IonText style={{ color: "var(--ion-color-medium)" }}>
              <h3 style={{ margin: "0 0 4px", fontWeight: 600 }}>
                {searchText.trim()
                  ? "Sin resultados"
                  : "No hay canchas registradas"}
              </h3>
              <p style={{ margin: 0, fontSize: "14px" }}>
                {searchText.trim()
                  ? "Intenta con otro término de búsqueda"
                  : viewMode === "auth"
                    ? "Toca + para agregar tu primera cancha"
                    : "Aún no hay canchas públicas disponibles"}
              </p>
            </IonText>
          </IonRow>
        )}

        {/* Lista de canchas */}
        {!isLoading &&
          filteredCourts.map((court) => (
            <CourtCard
              key={court.id}
              court={court}
              onEdit={viewMode === "auth" ? handleEdit : undefined}
              onDelete={viewMode === "auth" ? handleDelete : undefined}
              onView={handleViewDetail}
              showActions={viewMode === "auth"}
            />
          ))}

        {/* Espacio inferior para FAB */}
        <div style={{ height: "80px" }} />

        {/* FAB para crear (solo en modo auth) — dentro de IonContent con slot="fixed" */}
        {viewMode === "auth" && (
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton onClick={handleCreate}>
              <IonIcon icon={addOutline} />
            </IonFabButton>
          </IonFab>
        )}
      </IonContent>

      {/* ── Modal Detalle (imperativo via ref) ── */}
      <IonModal
        ref={detailModalRef}
        onDidDismiss={() => setSelectedCourtId(null)}
      >
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={() => detailModalRef.current?.dismiss()}>
                <IonIcon icon={arrowBackOutline} />
              </IonButton>
            </IonButtons>
            <IonTitle>Detalle de Cancha</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          {loadingDetail && (
            <IonRow
              className="ion-justify-content-center ion-align-items-center"
              style={{ height: "40vh" }}
            >
              <IonSpinner name="crescent" />
            </IonRow>
          )}
          {selectedCourt && !loadingDetail && (
            <>
              {/* Cabecera */}
              <IonRow
                className="ion-align-items-center"
                style={{
                  gap: "14px",
                  marginBottom: "20px",
                  paddingTop: "8px",
                }}
              >
                <IonText
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(24,119,242,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px",
                    color: "var(--ion-color-primary)",
                  }}
                >
                  <IonIcon icon={footballOutline} />
                </IonText>
                <div>
                  <h2
                    style={{
                      margin: "0 0 4px",
                      fontSize: "20px",
                      fontWeight: 700,
                    }}
                  >
                    {selectedCourt.name}
                  </h2>
                  <IonChip
                    style={{
                      fontSize: "11px",
                      height: "24px",
                      margin: 0,
                      "--background": selectedCourt.active
                        ? "rgba(66,183,42,0.12)"
                        : "rgba(250,62,62,0.12)",
                      "--color": selectedCourt.active
                        ? "var(--ion-color-success)"
                        : "var(--ion-color-danger)",
                    }}
                  >
                    {selectedCourt.active ? "Activa" : "Inactiva"}
                  </IonChip>
                </div>
              </IonRow>

              {/* Info */}
              <IonCard>
                <IonCardContent>
                  <IonList lines="none">
                    <IonItem style={{ "--background": "transparent" }}>
                      <IonIcon
                        icon={locationOutline}
                        slot="start"
                        color="primary"
                      />
                      <IonLabel>
                        <h3 style={{ fontWeight: 600 }}>Ubicación</h3>
                        <p>{selectedCourt.location}</p>
                      </IonLabel>
                    </IonItem>

                    <IonItem style={{ "--background": "transparent" }}>
                      <IonIcon
                        icon={
                          selectedCourt.isIndoor ? homeOutline : sunnyOutline
                        }
                        slot="start"
                        color="primary"
                      />
                      <IonLabel>
                        <h3 style={{ fontWeight: 600 }}>Tipo</h3>
                        <p>
                          {selectedCourt.isIndoor
                            ? "Cancha techada"
                            : "Cancha al aire libre"}
                        </p>
                      </IonLabel>
                    </IonItem>

                    <IonItem style={{ "--background": "transparent" }}>
                      <IonIcon
                        icon={personOutline}
                        slot="start"
                        color="primary"
                      />
                      <IonLabel>
                        <h3 style={{ fontWeight: 600 }}>Administrador</h3>
                        <p>
                          {selectedCourt.User?.username
                            ? `@${selectedCourt.User.username}`
                            : `Usuario #${selectedCourt.userId}`}
                        </p>
                        {selectedCourt.User?.email && (
                          <IonNote>{selectedCourt.User.email}</IonNote>
                        )}
                      </IonLabel>
                    </IonItem>

                    {selectedCourt.latitude != null &&
                      selectedCourt.longitude != null && (
                        <IonItem style={{ "--background": "transparent" }}>
                          <IonIcon
                            icon={locationOutline}
                            slot="start"
                            color="primary"
                          />
                          <IonLabel>
                            <h3 style={{ fontWeight: 600 }}>Coordenadas</h3>
                            <p>
                              {selectedCourt.latitude.toFixed(6)},{" "}
                              {selectedCourt.longitude.toFixed(6)}
                            </p>
                          </IonLabel>
                        </IonItem>
                      )}

                    <IonItem style={{ "--background": "transparent" }}>
                      <IonIcon
                        icon={calendarOutline}
                        slot="start"
                        color="primary"
                      />
                      <IonLabel>
                        <h3 style={{ fontWeight: 600 }}>Creada</h3>
                        <p>
                          {new Date(selectedCourt.createdAt).toLocaleDateString(
                            "es-EC",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                          )}
                        </p>
                      </IonLabel>
                    </IonItem>
                  </IonList>
                </IonCardContent>
              </IonCard>

              {/* ── Horarios de la cancha ── */}
              <ScheduleListCard
                courtName={selectedCourt.name}
                schedules={courtSchedules ?? []}
                isLoading={loadingSchedules}
                isOwner={selectedCourt.userId === userId}
                onAdd={() =>
                  handleScheduleAdd(selectedCourt.id, selectedCourt.name)
                }
                onEdit={handleScheduleEdit}
                onDelete={handleScheduleDelete}
                onToggleActive={handleScheduleToggleActive}
              />
            </>
          )}
        </IonContent>
      </IonModal>

      {/* ── Modal Crear/Editar (imperativo via ref) ── */}
      <IonModal
        ref={formModalRef}
        onDidPresent={() => setFormModalVisible(true)}
        onDidDismiss={() => {
          setFormModalVisible(false);
          setEditingCourt(null);
        }}
      >
        <CourtFormContent
          onDismiss={() => {
            formModalRef.current?.dismiss();
            setEditingCourt(null);
          }}
          onSubmit={handleFormSubmit}
          court={editingCourt}
          isSubmitting={isSubmitting}
          defaultUserId={userId}
          mapVisible={formModalVisible}
        />
      </IonModal>

      {/* ── Modal Horario (crear/editar) ── */}
      <IonModal
        ref={scheduleModalRef}
        onDidDismiss={() => {
          setEditingSchedule(null);
          setScheduleCourtId(null);
          setScheduleCourtName("");
        }}
      >
        <ScheduleFormContent
          onDismiss={() => {
            scheduleModalRef.current?.dismiss();
            setEditingSchedule(null);
          }}
          onSubmit={handleScheduleFormSubmit}
          schedule={editingSchedule}
          courtId={scheduleCourtId ?? 0}
          courtName={scheduleCourtName}
          isSubmitting={isScheduleSubmitting}
        />
      </IonModal>

      <AppToast toast={toast} onDismiss={dismissToast} />
    </IonPage>
  );
};

export default Courts;
