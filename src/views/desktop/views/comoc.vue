<template>
    <div class="comoc-web">
        <div class="panel">
            <router-link class="menu-link" :to="{ name: RouteName.Chat }">
                <el-icon :size="16"><ChatRound /></el-icon>
                Chat
            </router-link>
            <router-link class="menu-link" :to="{ name: RouteName.Contact }">
                <el-icon :size="16"><User /></el-icon>
                Contact
            </router-link>
            <router-link class="menu-link" :to="{ name: RouteName.Preference }">
                <el-icon :size="16"><Setting /></el-icon>
                Preference
            </router-link>
        </div>
        <router-view class="comoc-web-content" />
    </div>
</template>
<script lang="ts" setup>
import { ElIcon } from 'element-plus'
import { RouteName } from '@/views/common/router/routes'
import { ChatRound, Setting, User } from '@element-plus/icons-vue'
</script>
<style lang="scss">
@import '../../common/styles/base/variable';

.comoc-web {
    display: flex;
    height: 100vh;
    width: 100%;

    .panel {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 130px;
        border-right: 1px solid lightgrey;

        .menu-link {
            display: flex;
            box-sizing: border-box;
            width: 100%;
            gap: 8px;
            padding: 12px 16px;
            align-items: flex-end;
            text-decoration: none;
            white-space: nowrap;
            font-size: 14px;
            line-height: 14px;
            color: inherit;

            &:hover {
                background-color: whitesmoke;
            }

            &:active,
            &.router-link-active,
            &.active {
                font-weight: bold;
                color: dodgerblue;
            }
        }
    }

    .comoc-web-content {
        flex: 1;
    }
}
</style>
