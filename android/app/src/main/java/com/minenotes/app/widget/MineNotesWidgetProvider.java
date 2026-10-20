package com.minenotes.app.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

import com.minenotes.app.MainActivity;
import com.minenotes.app.R;

/**
 * MineNotesWidgetProvider provides a homescreen widget for instant note capture
 * and zero-confirmation link clipping without opening the full application window.
 */
public class MineNotesWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_quick_note);

        // Intent for triggering quick note entry
        Intent quickNoteIntent = new Intent(context, MainActivity.class);
        quickNoteIntent.setAction(Intent.ACTION_VIEW);
        quickNoteIntent.putExtra("quick_note", true);
        quickNoteIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent pendingIntent = PendingIntent.getActivity(
            context,
            appWidgetId,
            quickNoteIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);
        views.setOnClickPendingIntent(R.id.widget_input_box, pendingIntent);
        views.setOnClickPendingIntent(R.id.widget_btn_add, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
